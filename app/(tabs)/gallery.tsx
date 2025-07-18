import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, ActivityIndicator, SectionList, Modal, TouchableOpacity, ScrollView, TextInput, Platform, FlatList, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as FileSystem from 'expo-file-system';
import { Bell, MoreHorizontal, Folder, Search, XCircle, Edit, CheckCircle } from 'lucide-react-native';
import { useRouter } from 'expo-router';

// --- INTERFACES ---
interface ImageData {
  id: string;
  uri: string;
  projectName: string;
  creationTime: number | null;
  timestamp?: string;
  ticket?: string;
}

interface PostData {
  title: string;
  authorName: string;
  authorAvatar: string;
  postTimestamp: string;
  data: ImageData[];
}

// --- UTILITY FUNCTIONS ---
const formatRelativeTime = (timestamp: string): string => {
  try {
    const now = new Date();
    const imageTime = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - imageTime.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} min ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 2592000) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } else {
      const months = Math.floor(diffInSeconds / 2592000);
      return `${months} month${months > 1 ? 's' : ''} ago`;
    }
  } catch (error) {
    return 'Unknown time';
  }
};

export default function GalleryScreen() {
  const router = useRouter();
  const [posts, setPosts] = React.useState<PostData[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedPost, setSelectedPost] = React.useState<PostData | null>(null);
  const [view, setView] = React.useState<'feed' | 'detail'>('feed'); // 'feed' or 'detail'
  const [searchTerm, setSearchTerm] = React.useState('');
  const [showRenameModal, setShowRenameModal] = React.useState(false);
  const [renamePost, setRenamePost] = React.useState<PostData | null>(null);
  const [newFolderName, setNewFolderName] = React.useState('');
  const [isRenaming, setIsRenaming] = React.useState(false);
  const [renamingTitle, setRenamingTitle] = React.useState<string | null>(null);
  const [refreshKey, setRefreshKey] = React.useState(0);
  const flatListRef = React.useRef<FlatList>(null);
  const [forceUpdate, setForceUpdate] = React.useState(0);

  // --- DATA FETCHING ---
  React.useEffect(() => {
    const fetchImages = async () => {
      setLoading(true);
      const galleryRoot = FileSystem.documentDirectory + 'gallery/';
      let postsData: PostData[] = [];
      try {
        const projectFolders = await FileSystem.readDirectoryAsync(galleryRoot).catch(() => []);
        for (const project of projectFolders) {
          const folder = galleryRoot + project + '/';
          const files = await FileSystem.readDirectoryAsync(folder);
          const images = files.filter(f => f.endsWith('.jpg'));

          const data = await Promise.all(images.map(async img => {
            let meta: any = {};
            try {
              const metaStr = await FileSystem.readAsStringAsync(folder + img + '.json');
              meta = JSON.parse(metaStr);
            } catch { }
            return {
              id: folder + img,
              uri: folder + img,
              ...meta,
              projectName: project,
              creationTime: meta.timestamp ? new Date(meta.timestamp).getTime() : 0,
            };
          }));

          if (data.length > 0) {
            data.sort((a, b) => b.creationTime - a.creationTime);
            
            // Use the most recent image's timestamp for the folder
            const mostRecentImage = data[0];
            const folderTimestamp = mostRecentImage.timestamp 
              ? formatRelativeTime(mostRecentImage.timestamp)
              : 'Unknown time';
            
            postsData.push({
              title: project,
              authorName: project.replace(/_/g, ' '),
              authorAvatar: '',
              postTimestamp: folderTimestamp,
              data,
            });
          }
        }
      } catch { }
      setPosts(postsData);
      setLoading(false);
    };
    fetchImages();
  }, []);

  // --- FILTERING ---
  const filteredPosts = React.useMemo(() => {
    if (!searchTerm.trim()) return posts;
    return posts.filter(post => 
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.authorName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [posts, searchTerm]);
  


  // --- RENAME FUNCTIONALITY ---
  const handleRenameFolder = React.useCallback(() => {
    if (!renamePost || !newFolderName.trim() || isRenaming) return;
    
    const trimmedName = newFolderName.trim();
    const oldTitle = renamePost.title;
    
    // Close modal immediately
    setShowRenameModal(false);
    setRenamePost(null);
    setNewFolderName('');
    setIsRenaming(true);
    setRenamingTitle(trimmedName);
    
    // Optimistically update the UI immediately
    const newPosts = posts.map(post => 
      post.title === oldTitle 
        ? { 
            ...post, 
            title: trimmedName, 
            authorName: trimmedName.replace(/_/g, ' '),
            data: post.data.map(image => ({
              ...image,
              uri: image.uri.replace(`/gallery/${oldTitle}/`, `/gallery/${trimmedName}/`),
              id: image.id.replace(`/gallery/${oldTitle}/`, `/gallery/${trimmedName}/`),
              projectName: trimmedName
            }))
          }
        : post
    );
    
    // Force complete re-render by clearing and setting
    setPosts([]);
    setTimeout(() => {
      setPosts(newPosts);
      setRefreshKey(prev => prev + 1);
      setForceUpdate(prev => prev + 1);
    }, 0);
    
    // Perform file system operation in background without blocking UI
    (async () => {
      try {
        const galleryRoot = FileSystem.documentDirectory + 'gallery/';
        const oldPath = galleryRoot + oldTitle + '/';
        const newPath = galleryRoot + trimmedName + '/';
        
        // Check if new folder name already exists
        const exists = await FileSystem.getInfoAsync(newPath);
        if (exists.exists) {
          // Revert the optimistic update
          setPosts(prevPosts => {
            const revertedPosts = prevPosts.map(post => 
              post.title === trimmedName 
                ? { 
                    ...post, 
                    title: oldTitle, 
                    authorName: oldTitle.replace(/_/g, ' '),
                    data: post.data.map(image => ({
                      ...image,
                      uri: image.uri.replace(`/gallery/${trimmedName}/`, `/gallery/${oldTitle}/`),
                      id: image.id.replace(`/gallery/${trimmedName}/`, `/gallery/${oldTitle}/`),
                      projectName: oldTitle
                    }))
                  }
                : post
            );
            return [...revertedPosts]; // Force new array reference
          });
          alert('A folder with this name already exists');
          setIsRenaming(false);
          setRenamingTitle(null);
          return;
        }
        
        // Rename the folder in the file system
        await FileSystem.moveAsync({
          from: oldPath,
          to: newPath
        });
        
        setIsRenaming(false);
        setRenamingTitle(null);
        
      } catch (error) {
        // Revert the optimistic update on error
        setPosts(prevPosts => {
          const revertedPosts = prevPosts.map(post => 
            post.title === trimmedName 
              ? { 
                  ...post, 
                  title: oldTitle, 
                  authorName: oldTitle.replace(/_/g, ' '),
                  data: post.data.map(image => ({
                    ...image,
                    uri: image.uri.replace(`/gallery/${trimmedName}/`, `/gallery/${oldTitle}/`),
                    id: image.id.replace(`/gallery/${trimmedName}/`, `/gallery/${oldTitle}/`),
                    projectName: oldTitle
                  }))
                }
              : post
          );
          return [...revertedPosts]; // Force new array reference
        });
        alert('Failed to rename folder');
        setIsRenaming(false);
        setRenamingTitle(null);
      }
    })();
  }, [renamePost, newFolderName, isRenaming]);

  const openRenameModal = React.useCallback((post: PostData) => {
    if (isRenaming) return; // Prevent opening modal while renaming
    setRenamePost(post);
    setNewFolderName(post.title);
    setShowRenameModal(true);
  }, [isRenaming]);

  // --- RENDER FUNCTIONS ---

  const renderFeed = () => (
    <>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Folders</Text>
        <Bell size={24} color="#111827" />
      </View>
      <View style={styles.searchContainer}>
        <Search size={20} color="#9CA3AF" style={styles.searchIcon} />
        <TextInput 
          placeholder="Search for a folder" 
          style={styles.searchInput} 
          value={searchTerm}
          onChangeText={setSearchTerm}
        />
      </View>
      <FlatList
        ref={flatListRef}
        key={`${refreshKey}-${forceUpdate}`}
        data={filteredPosts}
        keyExtractor={(item) => `${item.title}-${item.authorName}-${refreshKey}-${forceUpdate}`}
        extraData={`${posts.length}-${refreshKey}-${forceUpdate}`}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => { setSelectedPost(item); setView('detail'); }} activeOpacity={0.9}>
            <PostCard 
              post={item} 
              onRename={() => openRenameModal(item)} 
              isRenaming={isRenaming && renamingTitle === item.title}
            />
          </TouchableOpacity>
        )}
        ListEmptyComponent={() => (
          <View style={styles.placeholderContainer}>
            <Folder size={48} color="#9CA3AF" />
            <Text style={styles.placeholderTitle}>
              {searchTerm.trim() ? 'No Matching Folders' : 'No Projects Found'}
            </Text>
            <Text style={styles.placeholderText}>
              {searchTerm.trim() ? 'Try a different search term.' : 'Your photo projects will appear here.'}
            </Text>
          </View>
        )}
        contentContainerStyle={{ paddingBottom: 40 }}
      />
    </>
  );

  const renderDetailView = () => (
    selectedPost && (
      <ScrollView>
        <TouchableOpacity style={styles.backButton} onPress={() => setView('feed')}>
           <Text style={styles.backButtonText}>{'< Back'}</Text>
        </TouchableOpacity>
        <View style={styles.detailHeader}>
            <Text style={styles.detailTitle}>#{selectedPost.title.replace(/_/g, ' ')}</Text>
        </View>
        <View style={styles.detailImageGrid}>
          {selectedPost.data.map((item, index) => (
            <TouchableOpacity 
              key={item.id} 
              onPress={() => {
                router.push({
                  pathname: '/ImageViewer',
                  params: {
                    images: JSON.stringify(selectedPost.data),
                    currentIndex: index.toString()
                  }
                });
              }} 
              activeOpacity={0.8}
            >
              <Image source={{ uri: item.uri }} style={styles.detailImageItem} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    )
  );

  return (
    <SafeAreaView style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#4F46E5" style={{ flex: 1 }} />
      ) : view === 'feed' ? (
        renderFeed()
      ) : (
        renderDetailView()
      )}



      {/* Rename Modal */}
      <Modal visible={showRenameModal} transparent animationType="fade" onRequestClose={() => setShowRenameModal(false)}>
        <View style={styles.renameModalOverlay}>
          <View style={styles.renameModalContent}>
            <Text style={styles.renameModalTitle}>Rename Folder</Text>
            <TextInput
              style={styles.renameInput}
              value={newFolderName}
              onChangeText={setNewFolderName}
              placeholder="Enter new folder name"
              autoFocus
            />
            <View style={styles.renameModalButtons}>
              <TouchableOpacity
                style={[styles.renameButton, styles.cancelButton]}
                onPress={() => setShowRenameModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.renameButton, styles.confirmButton, isRenaming && styles.disabledButton]}
                onPress={handleRenameFolder}
                disabled={isRenaming}
              >
                {isRenaming ? (
                  <ActivityIndicator size={16} color="#fff" />
                ) : (
                  <CheckCircle size={16} color="#fff" />
                )}
                <Text style={styles.confirmButtonText}>
                  {isRenaming ? 'Renaming...' : 'Rename'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// --- COMPONENTS ---

const PostCard = ({ post, onRename, isRenaming }: { post: PostData; onRename: () => void; isRenaming?: boolean }) => {
  const images = post.data;
  const imagePreview = images.slice(0, 3); // Show max 3 images in preview

  return (
    <View style={[styles.card, isRenaming && styles.cardRenaming]}>
      {/* Card Header */}
      <View style={styles.cardHeader}>
        <Folder size={44} color="#3B82F6" style={styles.folderIcon} />
        <View style={{ flex: 1 }}>
          <Text style={styles.authorName}>{post.authorName}</Text>
          <Text style={styles.timestamp}>{post.postTimestamp}</Text>
        </View>
        <TouchableOpacity onPress={onRename} style={styles.editButton} disabled={isRenaming}>
          {isRenaming ? (
            <ActivityIndicator size={20} color="#6B7280" />
          ) : (
            <Edit size={20} color="#6B7280" />
          )}
        </TouchableOpacity>
      </View>
      
      {/* Image Preview Grid */}
      {imagePreview.length > 0 && (
        <View style={styles.imagePreviewContainer}>
          <View style={{ flex: 2, paddingRight: 4 }}>
            <Image source={{ uri: imagePreview[0].uri }} style={[styles.previewImage, { height: 210 }]} />
          </View>
          <View style={{ flex: 1, paddingLeft: 4 }}>
            {imagePreview[1] && <Image source={{ uri: imagePreview[1].uri }} style={[styles.previewImage, { height: 101, marginBottom: 8 }]} />}
            {imagePreview[2] && <Image source={{ uri: imagePreview[2].uri }} style={[styles.previewImage, { height: 101 }]} />}
          </View>
        </View>
      )}

      {/* Card Footer */}
      <View style={styles.cardFooter}>
        <Text style={styles.cardDescription}>{post.data.length} images</Text>
      </View>
    </View>
  );
};


// --- STYLES ---

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6', // Light gray background
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  searchContainer: {
    marginHorizontal: 20,
    marginVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: '#1F2937',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginHorizontal: 20,
    marginVertical: 10,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardRenaming: {
    opacity: 0.7,
    backgroundColor: '#F3F4F6',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
    backgroundColor: '#E5E7EB',
  },
  folderIcon: {
    marginRight: 12,
  },
  editButton: {
    padding: 8,
    borderRadius: 8,
  },
  authorName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  timestamp: {
    fontSize: 14,
    color: '#6B7280',
  },
  imagePreviewContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    height: 210,
  },
  previewImage: {
    width: '100%',
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  cardFooter: {
    paddingTop: 8,
  },
  cardHashtag: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  cardDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  placeholderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: '30%',
  },
  placeholderTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#4B5563',
    marginTop: 16,
  },
  placeholderText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  // Detail View Styles
  backButton: {
    margin: 20,
    marginBottom: 0
  },
  backButtonText: {
    color: '#4F46E5',
    fontSize: 18,
    fontWeight: '600'
  },
  detailHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB'
  },
  detailTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827'
  },
  detailDescription: {
    fontSize: 16,
    color: '#4B5563',
    marginTop: 8,
    lineHeight: 24,
  },
  detailImageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    padding: 10,
  },
  detailImageItem: {
    width: (Platform.OS === 'web' ? 360 : (Dimensions.get('window').width - 40) / 3) - 8,
    height: (Platform.OS === 'web' ? 360 : (Dimensions.get('window').width - 40) / 3) - 8,
    borderRadius: 8,
    margin: 4,
    backgroundColor: '#E5E7EB',
  },

  // Rename Modal Styles
  renameModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  renameModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    margin: 20,
    width: '80%',
    alignSelf: 'center',
  },
  renameModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
    textAlign: 'center',
  },
  renameInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
    backgroundColor: '#F9FAFB',
  },
  renameModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  renameButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  confirmButton: {
    backgroundColor: '#3B82F6',
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
    opacity: 0.6,
  },
  cancelButtonText: {
    color: '#6B7280',
    fontWeight: '600',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});