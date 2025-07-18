import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions, StatusBar, Alert, PanResponder } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, ChevronRight, X, Share, Download } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

interface ImageData {
  id: string;
  uri: string;
  projectName: string;
  creationTime: number | null;
  timestamp?: string;
  ticket?: string;
}

export default function ImageViewer() {
  const router = useRouter();
  const { images, currentIndex } = useLocalSearchParams();
  
  const [parsedImages, setParsedImages] = useState<ImageData[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isSwipeActive, setIsSwipeActive] = useState(false);

  useEffect(() => {
    if (images) {
      try {
        const imageArray = JSON.parse(images as string);
        setParsedImages(imageArray);
        setCurrentImageIndex(parseInt(currentIndex as string) || 0);
      } catch (error) {
        console.error('Error parsing images:', error);
        Alert.alert('Error', 'Failed to load images');
        router.back();
      }
    }
  }, [images, currentIndex]);

  // Swipe gesture handler
  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (evt, gestureState) => {
      // Only respond to horizontal swipes
      return Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 20;
    },
    onPanResponderGrant: () => {
      // Visual feedback when swipe starts
      setIsSwipeActive(true);
    },
    onPanResponderMove: (evt, gestureState) => {
      // Optional: Add visual feedback during swipe
    },
    onPanResponderRelease: (evt, gestureState) => {
      // Reset visual feedback
      setIsSwipeActive(false);
      
      // Swipe threshold
      const swipeThreshold = 50;
      
      if (gestureState.dx > swipeThreshold) {
        // Swipe right - go to previous image
        goToPrevious();
      } else if (gestureState.dx < -swipeThreshold) {
        // Swipe left - go to next image
        goToNext();
      }
    },
    onPanResponderTerminate: () => {
      // Reset visual feedback if gesture is terminated
      setIsSwipeActive(false);
    },
  });

  const currentImage = parsedImages[currentImageIndex];

  const goToPrevious = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
    }
  };

  const goToNext = () => {
    if (currentImageIndex < parsedImages.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
    }
  };

  const formatDate = (timestamp?: string) => {
    if (!timestamp) return 'Unknown date';
    try {
      return new Date(timestamp).toLocaleString();
    } catch {
      return 'Unknown date';
    }
  };

  if (!currentImage) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Loading...</Text>
      </SafeAreaView>
    );
  }

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
            <X size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {currentImageIndex + 1} of {parsedImages.length}
          </Text>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.headerButton}>
              <Share size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerButton}>
              <Download size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Image */}
        <View style={[styles.imageContainer, { opacity: isSwipeActive ? 0.8 : 1 }]} {...panResponder.panHandlers}>
          <Image 
            source={{ uri: currentImage.uri }} 
            style={styles.image} 
            resizeMode="contain"
          />
        </View>

        {/* Navigation */}
        <View style={styles.navigationContainer}>
          <TouchableOpacity 
            onPress={goToPrevious}
            style={[styles.navButton, currentImageIndex === 0 && styles.navButtonDisabled]}
            disabled={currentImageIndex === 0}
          >
            <ChevronLeft size={32} color={currentImageIndex === 0 ? '#666' : '#fff'} />
          </TouchableOpacity>
          
          <View style={styles.imageInfo}>
            <Text style={styles.projectName}>{currentImage.projectName}</Text>
            <Text style={styles.timestamp}>{formatDate(currentImage.timestamp)}</Text>
            {currentImage.ticket && (
              <Text style={styles.ticket}>Ticket: {currentImage.ticket}</Text>
            )}
           
          </View>
          
          <TouchableOpacity 
            onPress={goToNext}
            style={[styles.navButton, currentImageIndex === parsedImages.length - 1 && styles.navButtonDisabled]}
            disabled={currentImageIndex === parsedImages.length - 1}
          >
            <ChevronRight size={32} color={currentImageIndex === parsedImages.length - 1 ? '#666' : '#fff'} />
          </TouchableOpacity>
        </View>


      </SafeAreaView>
    </>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  headerButton: {
    padding: 8,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  headerRight: {
    flexDirection: 'row',
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: width,
    height: height * 0.7,
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  navButton: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  navButtonDisabled: {
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  imageInfo: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  projectName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  timestamp: {
    color: '#ccc',
    fontSize: 14,
    marginBottom: 2,
  },
  ticket: {
    color: '#ccc',
    fontSize: 12,
  },
  swipeHint: {
    color: '#999',
    fontSize: 11,
    marginTop: 8,
    fontStyle: 'italic',
  },
}); 