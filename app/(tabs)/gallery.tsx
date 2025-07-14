import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, ActivityIndicator, SectionList, Modal, TouchableOpacity, ScrollView, TextInput, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as FileSystem from 'expo-file-system';
import { Brain, Image as ImageIcon, XCircle, Search, MapPin, Hash, Clock, Folder } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function GalleryScreen() {
  const [sections, setSections] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [resolving, setResolving] = React.useState(false);
  const [selectedImage, setSelectedImage] = React.useState(null);
  const [selectedProject, setSelectedProject] = React.useState('');
  const [folderView, setFolderView] = React.useState(true); // true = show folders, false = show images in folder

  React.useEffect(() => {
    const fetchImages = async () => {
      setLoading(true);
      const galleryRoot = FileSystem.documentDirectory + 'gallery/';
      let sectionsData = [];
      try {
        const projectFolders = await FileSystem.readDirectoryAsync(galleryRoot).catch(() => []);
        for (const project of projectFolders) {
          const folder = galleryRoot + project + '/';
          const files = await FileSystem.readDirectoryAsync(folder);
          // Find all .jpg files and their .json metadata
          const images = files.filter(f => f.endsWith('.jpg'));
          const data = await Promise.all(images.map(async img => {
            let meta = {};
            try {
              const metaStr = await FileSystem.readAsStringAsync(folder + img + '.json');
              meta = JSON.parse(metaStr);
            } catch {}
            return {
              id: folder + img,
              uri: folder + img,
              ...meta,
              projectName: project,
              creationTime: meta.timestamp ? new Date(meta.timestamp).getTime() / 1000 : null,
            };
          }));
          if (data.length > 0) {
            // Sort images by date descending
            data.sort((a, b) => (b.creationTime || 0) - (a.creationTime || 0));
            sectionsData.push({
              title: project,
              data,
            });
          }
        }
      } catch {}
      setSections(sectionsData);
      setLoading(false);
    };
    setResolving(true);
    fetchImages().then(() => setResolving(false));
  }, []);

  // FOLDER LIST VIEW
  const filteredFolders = sections;
  // IMAGES IN SELECTED FOLDER
  const selectedSection = sections.find(s => s.title === selectedProject);
  const filteredImages = selectedSection ? selectedSection.data : [];

  // Minimal folder grid
  return (
    <SafeAreaView style={styles.container}>
      {loading || resolving ? (
        <ActivityIndicator size="large" color="#3B82F6" style={{ marginTop: 40 }} />
      ) : folderView ? (
        filteredFolders.length === 0 ? (
          <View style={styles.placeholderContainer}>
            <Text style={styles.placeholderTitle}>No Projects</Text>
          </View>
        ) : (
          <View style={styles.folderGrid}>
            {filteredFolders.map(folder => (
              <TouchableOpacity
                key={folder.title}
                style={styles.folderCard}
                onPress={() => { setSelectedProject(folder.title); setFolderView(false); }}
                activeOpacity={0.8}
              >
                <Folder size={48} color="#3B82F6" style={{ marginBottom: 18 }} />
                <Text style={styles.folderName}>{folder.title}</Text>
                <Text style={styles.folderCount}>{folder.data.length} images</Text>
              </TouchableOpacity>
            ))}
          </View>
        )
      ) : (
        <>
          <TouchableOpacity style={styles.backButton} onPress={() => { setFolderView(true); setSelectedProject(''); }}>
            <Text style={styles.backButtonText}>{'< Folders'}</Text>
          </TouchableOpacity>
          {filteredImages.length === 0 ? (
            <View style={styles.placeholderContainer}>
              <Text style={styles.placeholderTitle}>No Images</Text>
            </View>
          ) : (
            <View style={styles.imageGrid}>
              {filteredImages.map(item => (
                <TouchableOpacity key={item.id} onPress={() => { setSelectedImage(item); }} activeOpacity={0.8}>
                  <View style={styles.imageCard}>
                    {item.uri ? (
                      <>
                        <Image source={{ uri: item.uri }} style={styles.image} />
                        <View style={styles.stickerOverlay}>
                          {item.projectName ? <Text style={styles.stickerText}>{item.projectName}</Text> : null}
                          {item.ticket ? <Text style={styles.stickerText}>{item.ticket}</Text> : null}
                          {item.timestamp ? <Text style={styles.stickerTextSmall}>{new Date(item.timestamp).toLocaleDateString()}</Text> : null}
                        </View>
                      </>
                    ) : (
                      <View style={[styles.image, { justifyContent: 'center', alignItems: 'center' }]}> 
                        <ActivityIndicator size="small" color="#3B82F6" />
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </>
      )}
      {/* Minimal image detail modal */}
      {selectedImage && (
        <Modal visible transparent animationType="fade" onRequestClose={() => setSelectedImage(null)}>
          <View style={styles.detailModalOverlay}>
            <View style={styles.detailModalContent}>
              <TouchableOpacity style={styles.detailCloseButton} onPress={() => setSelectedImage(null)}>
                <XCircle size={28} color="#fff" />
              </TouchableOpacity>
              <Image source={{ uri: selectedImage.uri }} style={styles.detailImage} resizeMode="contain" />
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  folderGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    padding: 8,
    gap: 12,
  },
  folderCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 18,
    paddingHorizontal: 14,
    margin: 8,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    minWidth: 90,
    minHeight: 90,
    maxWidth: 110,
  },
  folderName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#3B82F6',
    marginBottom: 4,
    textAlign: 'center',
  },
  folderCount: {
    fontSize: 11,
    color: '#6B7280',
    textAlign: 'center',
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    padding: 10,
    gap: 16,
  },
  imageCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    margin: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    alignItems: 'center',
    width: 140,
    height: 140,
    overflow: 'hidden',
  },
  image: {
    width: 140,
    height: 140,
    borderRadius: 14,
  },
  placeholderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  placeholderTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#9CA3AF',
    marginTop: 16,
    marginBottom: 8,
  },
  backButton: {
    marginLeft: 16,
    marginBottom: 8,
    marginTop: 4,
  },
  backButtonText: {
    color: '#2563EB',
    fontSize: 16,
    fontWeight: '600',
  },
  detailModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  detailModalContent: {
    backgroundColor: '#222',
    borderRadius: 18,
    padding: 16,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    elevation: 8,
  },
  detailCloseButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 10,
  },
  detailImage: {
    width: 300,
    height: 300,
    borderRadius: 12,
    marginTop: 32,
    marginBottom: 16,
    backgroundColor: '#111',
  },
  stickerOverlay: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 8,
    paddingVertical: 3,
    paddingHorizontal: 7,
    zIndex: 10,
    minWidth: 50,
    alignItems: 'flex-start',
  },
  stickerText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 1,
  },
  stickerTextSmall: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '400',
    opacity: 0.8,
  },
}); 