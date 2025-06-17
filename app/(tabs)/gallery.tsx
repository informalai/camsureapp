import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, TextInput, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Grid, List, Trash2, Sticker, Calendar } from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import AppStorage, { PhotoMetadata, AppStorage as AppStorageClass } from '../../utils/storage';

const FILTER_TABS = ['All', 'With Stickers', 'Recent'];

export default function GalleryTab() {
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [photos, setPhotos] = useState<PhotoMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [storageInfo, setStorageInfo] = useState({ totalPhotos: 0, totalSize: 0 });

  const loadPhotos = async () => {
    try {
      const allPhotos = await AppStorage.getAllPhotos();
      setPhotos(allPhotos);
      
      const info = await AppStorage.getStorageInfo();
      setStorageInfo(info);
    } catch (error) {
      console.error('Error loading photos:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPhotos();
    setRefreshing(false);
  };

  const deletePhoto = async (photoId: string) => {
    Alert.alert(
      'Delete Photo',
      'Are you sure you want to delete this photo? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const success = await AppStorage.deletePhoto(photoId);
            if (success) {
              await loadPhotos(); // Refresh the list
            } else {
              Alert.alert('Error', 'Failed to delete photo');
            }
          },
        },
      ]
    );
  };

  const getFilteredPhotos = () => {
    let filtered = photos;
    
    // Apply filter
    switch (activeFilter) {
      case 'With Stickers':
        filtered = photos.filter(photo => photo.hasStickers);
        break;
      case 'Recent':
        const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
        filtered = photos.filter(photo => photo.timestamp > oneDayAgo);
        break;
      default:
        filtered = photos;
    }
    
    // Apply search
    if (searchQuery.trim()) {
      filtered = filtered.filter(photo => 
        AppStorageClass.formatDate(photo.timestamp).toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return filtered;
  };

  useFocusEffect(
    useCallback(() => {
      loadPhotos();
    }, [])
  );

  const filteredPhotos = getFilteredPhotos();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Gallery</Text>
        <TouchableOpacity 
          style={styles.viewToggle}
          onPress={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
        >
          {viewMode === 'grid' ? (
            <List size={24} color="#007AFF" />
          ) : (
            <Grid size={24} color="#007AFF" />
          )}
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={20} color="#8E8E93" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by date..."
            placeholderTextColor="#8E8E93"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScrollContent}
        >
          {FILTER_TABS.map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterTab,
                activeFilter === filter && styles.activeFilterTab
              ]}
              onPress={() => setActiveFilter(filter)}
            >
              <Text style={[
                styles.filterTabText,
                activeFilter === filter && styles.activeFilterTabText
              ]}>
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Photo Grid */}
      <ScrollView 
        style={styles.photosContainer} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#007AFF" />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading photos...</Text>
          </View>
        ) : filteredPhotos.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Calendar size={48} color="#8E8E93" />
            <Text style={styles.emptyText}>No photos found</Text>
            <Text style={styles.emptySubtext}>
              {photos.length === 0 
                ? 'Take some photos to see them here!' 
                : 'Try adjusting your search or filter'}
            </Text>
          </View>
        ) : (
          <View style={styles.photosGrid}>
            {filteredPhotos.map((photo) => (
              <View key={photo.id} style={styles.photoContainer}>
                <TouchableOpacity style={styles.photoItem}>
                  <Image source={{ uri: photo.uri }} style={styles.photo} />
                  {photo.hasStickers && (
                    <View style={styles.stickerBadge}>
                      <Sticker size={12} color="#FFF" />
                      <Text style={styles.stickerCount}>{photo.stickerCount}</Text>
                    </View>
                  )}
                </TouchableOpacity>
                
                <View style={styles.photoInfo}>
                  <Text style={styles.photoDate}>{AppStorageClass.formatDate(photo.timestamp)}</Text>
                  <TouchableOpacity 
                    style={styles.deleteButton}
                    onPress={() => deletePhoto(photo.id)}
                  >
                    <Trash2 size={16} color="#FF3B30" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Footer Stats */}
      <View style={styles.footer}>
        <Text style={styles.photoCount}>
          {filteredPhotos.length} of {storageInfo.totalPhotos} photos
        </Text>
        <Text style={styles.storageSize}>
          {AppStorageClass.formatFileSize(storageInfo.totalSize)}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFF',
  },
  viewToggle: {
    padding: 8,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#FFF',
  },
  filterContainer: {
    paddingBottom: 20,
  },
  filterScrollContent: {
    paddingHorizontal: 20,
  },
  filterTab: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1C1C1E',
    marginRight: 12,
  },
  activeFilterTab: {
    backgroundColor: '#007AFF',
  },
  filterTabText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#8E8E93',
  },
  activeFilterTabText: {
    color: '#FFF',
  },
  photosContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  photoContainer: {
    width: '31%',
    marginBottom: 16,
  },
  photoItem: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  photo: {
    width: '100%',
    height: '100%',
    backgroundColor: '#1C1C1E',
  },
  stickerBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0, 122, 255, 0.8)',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  stickerCount: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '600',
  },
  photoInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  photoDate: {
    fontSize: 10,
    color: '#8E8E93',
    flex: 1,
  },
  deleteButton: {
    padding: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    color: '#8E8E93',
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    color: '#8E8E93',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: '#1C1C1E',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  photoCount: {
    fontSize: 14,
    color: '#8E8E93',
  },
  storageSize: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
  },
});