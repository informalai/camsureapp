import React, { useRef, useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, TextInput, Dimensions, PanResponder, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CheckCircle, XCircle, Edit, Folder, Hash, Crop, RotateCcw, Save, MapPin, Clock } from 'lucide-react-native';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import { captureRef } from 'react-native-view-shot';


const { width, height } = Dimensions.get('window');

export default function CameraPreview() {
  const router = useRouter();
  const { photoUri, location, timestamp, projectName: initialProjectName, ticketNumber: initialTicketNumber } = useLocalSearchParams();

  // Image state
  const [currentImageUri, setCurrentImageUri] = useState(photoUri as string);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cropMode, setCropMode] = useState(false);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  
  // Ref for capturing the image with overlay
  const imageContainerRef = useRef<View>(null);
  


  // Sticker state
  const [stickerX, setStickerX] = useState(width * 0.1);
  const [stickerY, setStickerY] = useState(height * 0.6);
  const [stickerWidth, setStickerWidth] = useState(280);
  const [stickerHeight, setStickerHeight] = useState(120);
  const [dragging, setDragging] = useState(false);
  const [resizing, setResizing] = useState(false);

  // Sticker content state
  const [ticketNumber, setTicketNumber] = useState(initialTicketNumber as string || '');
  const [projectName, setProjectName] = useState(initialProjectName as string || '');
  const [showTicketInput, setShowTicketInput] = useState(false);
  const [showProjectInput, setShowProjectInput] = useState(false);

  // Crop area state - simplified working version
  const [cropX, setCropX] = useState(width * 0.1);
  const [cropY, setCropY] = useState(height * 0.2);
  const [cropW, setCropW] = useState(width * 0.8);
  const [cropH, setCropH] = useState(height * 0.4);
  const [isDragging, setIsDragging] = useState(false);
  const [activeHandle, setActiveHandle] = useState<string | null>(null);

  // PanResponder for dragging sticker
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !cropMode,
      onPanResponderGrant: () => setDragging(true),
      onPanResponderMove: (evt, gestureState) => {
        setStickerX(Math.max(0, Math.min(stickerX + gestureState.dx, width - stickerWidth)));
        setStickerY(Math.max(0, Math.min(stickerY + gestureState.dy, height - stickerHeight - 100)));
      },
      onPanResponderRelease: () => setDragging(false),
    })
  ).current;

  // PanResponder for resizing sticker
  const resizeResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !cropMode,
      onPanResponderGrant: () => setResizing(true),
      onPanResponderMove: (evt, gestureState) => {
        setStickerWidth(Math.max(120, stickerWidth + gestureState.dx));
        setStickerHeight(Math.max(40, stickerHeight + gestureState.dy));
      },
      onPanResponderRelease: () => setResizing(false),
    })
  ).current;

  // Simple working PanResponders
  const createCornerResponder = (corner: string) => {
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        setActiveHandle(corner);
      },
      onPanResponderMove: (evt, gestureState) => {
        const { dx, dy } = gestureState;
        
        switch (corner) {
          case 'topLeft':
            const newX = Math.max(0, Math.min(cropX + dx, cropX + cropW - 100));
            const newY = Math.max(50, Math.min(cropY + dy, cropY + cropH - 100));
            const newW = cropW - (newX - cropX);
            const newH = cropH - (newY - cropY);
            setCropX(newX);
            setCropY(newY);
            setCropW(newW);
            setCropH(newH);
            break;
          case 'topRight':
            const newW2 = Math.max(100, Math.min(cropW + dx, width - cropX));
            const newY2 = Math.max(50, Math.min(cropY + dy, cropY + cropH - 100));
            const newH2 = cropH - (newY2 - cropY);
            setCropW(newW2);
            setCropY(newY2);
            setCropH(newH2);
            break;
          case 'bottomLeft':
            const newX3 = Math.max(0, Math.min(cropX + dx, cropX + cropW - 100));
            const newW3 = cropW - (newX3 - cropX);
            const newH3 = Math.max(100, Math.min(cropH + dy, height - cropY - 200));
            setCropX(newX3);
            setCropW(newW3);
            setCropH(newH3);
            break;
          case 'bottomRight':
            const newW4 = Math.max(100, Math.min(cropW + dx, width - cropX));
            const newH4 = Math.max(100, Math.min(cropH + dy, height - cropY - 200));
            setCropW(newW4);
            setCropH(newH4);
            break;
        }
      },
      onPanResponderRelease: () => {
        setActiveHandle(null);
      },
    });
  };

  const topLeftResponder = useRef(createCornerResponder('topLeft')).current;
  const topRightResponder = useRef(createCornerResponder('topRight')).current;
  const bottomLeftResponder = useRef(createCornerResponder('bottomLeft')).current;
  const bottomRightResponder = useRef(createCornerResponder('bottomRight')).current;

  // PanResponder for moving the entire crop area
  const cropMoveResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        setIsDragging(true);
      },
      onPanResponderMove: (evt, gestureState) => {
        const { dx, dy } = gestureState;
        const newX = Math.max(0, Math.min(cropX + dx, width - cropW));
        const newY = Math.max(50, Math.min(cropY + dy, height - cropH - 200));
        setCropX(newX);
        setCropY(newY);
      },
      onPanResponderRelease: () => {
        setIsDragging(false);
      },
    })
  ).current;

  // Helper to format location
  const formatLocation = () => {
    if (!location) return '';
    try {
      const loc = typeof location === 'string' ? JSON.parse(location) : location;
      return `${loc.latitude?.toFixed(4)}, ${loc.longitude?.toFixed(4)}`;
    } catch {
      return '';
    }
  };

  // Helper to format timestamp
  const formatTimestamp = () => {
    if (!timestamp) return '';
    try {
      return new Date(timestamp as string).toLocaleString();
    } catch {
      return timestamp as string;
    }
  };

  // Simplified crop function
  const cropImage = async () => {
    if (!currentImageUri) return;
    
    setIsProcessing(true);
    try {
      // Scale to image dimensions if available
      let finalCropX = cropX;
      let finalCropY = cropY;
      let finalCropW = cropW;
      let finalCropH = cropH;
      
      if (imageSize.width > 0 && imageSize.height > 0) {
        const imageAspectRatio = imageSize.width / imageSize.height;
        const screenAspectRatio = width / height;
        
        let displayedImageWidth, displayedImageHeight;
        let offsetX = 0, offsetY = 0;
        
        if (imageAspectRatio > screenAspectRatio) {
          displayedImageWidth = width;
          displayedImageHeight = width / imageAspectRatio;
          offsetY = (height - displayedImageHeight) / 2;
        } else {
          displayedImageHeight = height;
          displayedImageWidth = height * imageAspectRatio;
          offsetX = (width - displayedImageWidth) / 2;
        }
        
        const scaleX = imageSize.width / displayedImageWidth;
        const scaleY = imageSize.height / displayedImageHeight;
        
        finalCropX = Math.round((cropX - offsetX) * scaleX);
        finalCropY = Math.round((cropY - offsetY) * scaleY);
        finalCropW = Math.round(cropW * scaleX);
        finalCropH = Math.round(cropH * scaleY);
        
        finalCropX = Math.max(0, Math.min(finalCropX, imageSize.width - finalCropW));
        finalCropY = Math.max(0, Math.min(finalCropY, imageSize.height - finalCropH));
        finalCropW = Math.min(finalCropW, imageSize.width - finalCropX);
        finalCropH = Math.min(finalCropH, imageSize.height - finalCropY);
      }
      
      const result = await ImageManipulator.manipulateAsync(
        currentImageUri,
        [{
          crop: {
            originX: finalCropX,
            originY: finalCropY,
            width: finalCropW,
            height: finalCropH
          }
        }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      );

      setCurrentImageUri(result.uri);
      setCropMode(false);
      Alert.alert('Success', 'Image cropped successfully!');
    } catch (error) {
      console.error('Crop error:', error);
      Alert.alert('Error', 'Failed to crop image');
    } finally {
      setIsProcessing(false);
    }
  };

  // Rotate image function
  const rotateImage = async () => {
    if (!currentImageUri) return;
    
    setIsProcessing(true);
    try {
      const result = await ImageManipulator.manipulateAsync(
        currentImageUri,
        [{ rotate: 90 }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      );

      setCurrentImageUri(result.uri);
      Alert.alert('Success', 'Image rotated successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to rotate image');
    } finally {
      setIsProcessing(false);
    }
  };



  // Save handler
  const handleSave = async () => {
    if (!currentImageUri || !projectName) {
      Alert.alert('Error', 'Project name is required');
      return;
    }

    setIsProcessing(true);
    try {
      // Create project folder
      const folder = `${FileSystem.documentDirectory}gallery/${projectName}/`;
      await FileSystem.makeDirectoryAsync(folder, { intermediates: true }).catch(() => {});
      
      // Generate filename
      const fileName = `IMG_${Date.now()}.jpg`;
      const dest = folder + fileName;
      
      // Capture the image with overlay
      let finalImageUri = currentImageUri;
      
      if (imageContainerRef.current && !cropMode) {
        try {
          console.log('Capturing image with overlay...');
          
          // First, hide the edit buttons and indicators during capture
          const capturedUri = await captureRef(imageContainerRef.current, {
            format: 'jpg',
            quality: 0.8,
            result: 'tmpfile',
          });
          
          console.log('Successfully captured image with overlay:', capturedUri);
          finalImageUri = capturedUri;
        } catch (error) {
          console.log('Failed to capture overlay, using original:', error);
          // Fall back to original image
        }
      }
      
      // Copy final image to destination
      await FileSystem.copyAsync({ from: finalImageUri, to: dest });
      
      // Save metadata with overlay info
      const meta = {
        project: projectName,
        ticket: ticketNumber,
        timestamp: timestamp,
        location: location ? JSON.parse(location as string) : null,
        image: fileName,
        edited: true,
        originalUri: photoUri,
        overlayData: {
          projectName: projectName,
          ticketNumber: ticketNumber,
          location: formatLocation(),
          timestamp: formatTimestamp(),
          position: { x: stickerX, y: stickerY, width: stickerWidth, height: stickerHeight }
        }
      };
      
      await FileSystem.writeAsStringAsync(folder + fileName + '.json', JSON.stringify(meta));
      
      Alert.alert('Success', 'Image saved successfully!', [
        { text: 'OK', onPress: () => router.replace('/(tabs)/camera') }
      ]);
    } catch (error) {
      console.log('Save error:', error);
      Alert.alert('Error', 'Failed to save image');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Capturable container - this will be captured with overlay burned in */}
      <View ref={imageContainerRef} style={styles.captureContainer} pointerEvents="none">
        <Image 
          source={{ uri: currentImageUri }} 
          style={styles.captureImage} 
          resizeMode="cover"
        />
        
        {/* Fixed overlay that gets burned into the image */}
        {!cropMode && (
          <View style={styles.burnInOverlay}>
            <Text style={styles.burnInText}>📁 {projectName || 'Project'}</Text>
            <Text style={styles.burnInText}>🏷️ {ticketNumber || 'No Ticket'}</Text>
            <Text style={styles.burnInText}>📍 {formatLocation() || 'Location unavailable'}</Text>
            <Text style={styles.burnInText}>🕐 {formatTimestamp() || 'Time unavailable'}</Text>
          </View>
        )}
      </View>
      
      {/* Interactive preview image */}
      <Image 
        source={{ uri: currentImageUri }} 
        style={styles.photo} 
        resizeMode="contain"
        onLoad={(e) => {
          const { width: imgWidth, height: imgHeight } = e.nativeEvent.source;
          setImageSize({ width: imgWidth, height: imgHeight });
        }}
      />
        
        {/* Sticker overlay - inside capture container */}
        {!cropMode && (
          <View
            style={[
              styles.sticker,
              {
                left: stickerX,
                top: stickerY,
                width: stickerWidth,
                height: stickerHeight,
                opacity: dragging ? 0.8 : 1,
              },
            ]}
            {...panResponder.panHandlers}
          >
            <View style={styles.stickerContent}>
              <View style={styles.stickerRow}>
                <Folder size={16} color="#fff" />
                <Text style={styles.stickerText}>{projectName || 'Project'}</Text>
                <TouchableOpacity onPress={() => setShowProjectInput(true)}>
                  <Edit size={16} color="#fff" />
                </TouchableOpacity>
              </View>
              <View style={styles.stickerRow}>
                <Hash size={16} color="#fff" />
                <Text style={styles.stickerText}>{ticketNumber || 'Ticket #'}</Text>
                <TouchableOpacity onPress={() => setShowTicketInput(true)}>
                  <Edit size={16} color="#fff" />
                </TouchableOpacity>
              </View>
              <View style={styles.stickerRow}>
                <MapPin size={14} color="#fff" />
                <Text style={styles.stickerTextMedium}>{formatLocation() || 'Location unavailable'}</Text>
              </View>
              <View style={styles.stickerRow}>
                <Clock size={14} color="#fff" />
                <Text style={styles.stickerTextMedium}>{formatTimestamp() || 'Time unavailable'}</Text>
              </View>
            </View>
            <View
              style={styles.resizeHandle}
              {...resizeResponder.panHandlers}
            />
          </View>
        )}
        
        {/* Metadata indicator */}
        {!cropMode && (
          <View style={styles.captureIndicator}>
            <Text style={styles.captureIndicatorText}>
              🔥 Text will be burned into image: {projectName || 'Project'} • {ticketNumber || 'No Ticket'}
            </Text>
          </View>
        )}
      
      {/* Crop overlay */}
      {cropMode && (
        <View style={styles.cropOverlay}>
          {/* Dimmed areas */}
          <View style={[styles.cropDimmer, { height: cropY }]} />
          <View style={[styles.cropDimmer, { top: cropY, height: cropH, width: cropX }]} />
          <View style={[styles.cropDimmer, { top: cropY, left: cropX + cropW, width: width - cropX - cropW, height: cropH }]} />
          <View style={[styles.cropDimmer, { top: cropY + cropH, height: height - cropY - cropH }]} />
          
          {/* Crop selection area */}
          <View
            style={[
              styles.cropArea,
              {
                left: cropX,
                top: cropY,
                width: cropW,
                height: cropH,
                opacity: isDragging ? 0.8 : 1,
              },
            ]}
            {...cropMoveResponder.panHandlers}
          >
            {/* Grid lines for better visual feedback */}
            <View style={styles.cropGrid}>
              <View style={[styles.gridLine, { left: '33%', top: 0, bottom: 0, width: 1 }]} />
              <View style={[styles.gridLine, { left: '66%', top: 0, bottom: 0, width: 1 }]} />
              <View style={[styles.gridLine, { top: '33%', left: 0, right: 0, height: 1 }]} />
              <View style={[styles.gridLine, { top: '66%', left: 0, right: 0, height: 1 }]} />
            </View>
          </View>
          
          {/* Corner handles for resizing */}
          <View
            style={[
              styles.cropHandle,
              {
                left: cropX - 24,
                top: cropY - 24,
                opacity: activeHandle === 'topLeft' ? 0.8 : 1,
              }
            ]}
            {...topLeftResponder.panHandlers}
          />
          <View
            style={[
              styles.cropHandle,
              {
                left: cropX + cropW - 24,
                top: cropY - 24,
                opacity: activeHandle === 'topRight' ? 0.8 : 1,
              }
            ]}
            {...topRightResponder.panHandlers}
          />
          <View
            style={[
              styles.cropHandle,
              {
                left: cropX - 24,
                top: cropY + cropH - 24,
                opacity: activeHandle === 'bottomLeft' ? 0.8 : 1,
              }
            ]}
            {...bottomLeftResponder.panHandlers}
          />
          <View
            style={[
              styles.cropHandle,
              {
                left: cropX + cropW - 24,
                top: cropY + cropH - 24,
                opacity: activeHandle === 'bottomRight' ? 0.8 : 1,
              }
            ]}
            {...bottomRightResponder.panHandlers}
          />
        </View>
              )}

      {/* Edit tools */}
      <View style={styles.toolsRow}>
        <TouchableOpacity 
          style={[styles.toolButton, cropMode && styles.toolButtonActive]} 
          onPress={() => setCropMode(!cropMode)}
          disabled={isProcessing}
        >
          <Crop size={24} color={cropMode ? "#fff" : "#3B82F6"} />
          <Text style={[styles.toolText, cropMode && styles.toolTextActive]}>
            {cropMode ? 'Exit Crop' : 'Crop'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.toolButton} 
          onPress={rotateImage}
          disabled={isProcessing || cropMode}
        >
          <RotateCcw size={24} color={cropMode ? "#999" : "#3B82F6"} />
          <Text style={[styles.toolText, cropMode && { color: '#999' }]}>Rotate</Text>
        </TouchableOpacity>
      </View>



      {/* Crop actions */}
      {cropMode && (
        <View style={styles.cropActions}>
          <TouchableOpacity 
            style={styles.cropActionButton} 
            onPress={() => setCropMode(false)}
          >
            <XCircle size={20} color="#fff" />
            <Text style={styles.cropActionText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.cropActionButton, styles.cropActionButtonPrimary]} 
            onPress={cropImage}
            disabled={isProcessing}
          >
            <CheckCircle size={20} color="#fff" />
            <Text style={styles.cropActionText}>Apply Crop</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Input overlays for ticket/project */}
      {showTicketInput && (
        <View style={styles.inputOverlay}>
          <Text style={styles.inputLabel}>Enter Ticket Number</Text>
          <TextInput
            style={styles.input}
            value={ticketNumber}
            onChangeText={setTicketNumber}
            placeholder="Ticket Number"
            placeholderTextColor="#aaa"
            autoFocus
          />
          <TouchableOpacity style={styles.inputButton} onPress={() => setShowTicketInput(false)}>
            <CheckCircle size={20} color="#fff" />
            <Text style={styles.inputButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {showProjectInput && (
        <View style={styles.inputOverlay}>
          <Text style={styles.inputLabel}>Enter Project Name</Text>
          <TextInput
            style={styles.input}
            value={projectName}
            onChangeText={setProjectName}
            placeholder="Project Name"
            placeholderTextColor="#aaa"
            autoFocus
          />
          <TouchableOpacity style={styles.inputButton} onPress={() => setShowProjectInput(false)}>
            <CheckCircle size={20} color="#fff" />
            <Text style={styles.inputButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Confirm/Cancel buttons */}
      {!cropMode && (
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
            <XCircle size={24} color="#fff" />
            <Text style={styles.buttonText}>Retake</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.saveButton} 
            onPress={handleSave}
            disabled={isProcessing}
          >
            <Save size={24} color="#fff" />
            <Text style={styles.buttonText}>Save</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },

  photo: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: width,
    height: height,
    zIndex: 0,
  },
  sticker: {
    position: 'absolute',
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderRadius: 12,
    minWidth: 120,
    minHeight: 40,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
    padding: 12,
    zIndex: 2,
  },
  stickerContent: {
    flex: 1,
    justifyContent: 'center',
  },
  stickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
    gap: 6,
  },
  stickerText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginHorizontal: 4,
  },
  stickerTextSmall: {
    color: '#fff',
    fontSize: 12,
    marginHorizontal: 4,
    opacity: 0.8,
  },
  stickerTextMedium: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    marginHorizontal: 4,
    opacity: 0.9,
  },
  resizeHandle: {
    position: 'absolute',
    right: -12,
    bottom: -12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderWidth: 1,
    borderColor: '#fff',
    zIndex: 3,
  },
  inputOverlay: {
    position: 'absolute',
    top: '40%',
    left: '10%',
    right: '10%',
    backgroundColor: 'rgba(0,0,0,0.85)',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    zIndex: 10,
  },
  inputLabel: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  input: {
    width: '100%',
    backgroundColor: '#222',
    color: '#fff',
    fontSize: 16,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#444',
  },
  inputButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginTop: 8,
  },
  inputButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  buttonRow: {
    position: 'absolute',
    bottom: 60, // Increased margin from bottom
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    zIndex: 5,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  cropOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    zIndex: 1,
  },
  cropDimmer: {
    position: 'absolute',
    backgroundColor: 'rgba(0,0,0,0.6)',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  cropArea: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#3B82F6',
    borderRadius: 8,
    backgroundColor: 'transparent',
    zIndex: 2,
  },
  cropBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
  },
  cropResizeHandle: {
    position: 'absolute',
    right: -12,
    bottom: -12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderWidth: 1,
    borderColor: '#fff',
    zIndex: 3,
  },
  toolsRow: {
    position: 'absolute',
    top: 60, // Adjust based on photo height
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
    zIndex: 5,
  },
  toolButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  toolButtonActive: {
    backgroundColor: 'rgba(59,130,246,0.8)',
  },
  toolText: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  toolTextActive: {
    color: '#fff',
  },
  cropActions: {
    position: 'absolute',
    bottom: 180, // Adjust based on photo height
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
    zIndex: 5,
  },
  cropActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  cropActionButtonPrimary: {
    backgroundColor: '#3B82F6',
  },
  cropActionText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  cropGrid: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  gridLine: {
    position: 'absolute',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  cropHandle: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3B82F6',
    borderWidth: 3,
    borderColor: '#fff',
    zIndex: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cropHandleTopLeft: {
    top: -16,
    left: -16,
  },
  cropHandleTopRight: {
    top: -16,
    right: -16,
  },
  cropHandleBottomLeft: {
    bottom: -16,
    left: -16,
  },
  cropHandleBottomRight: {
    bottom: -16,
    right: -16,
  },
  cropDragIndicator: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -12 }, { translateY: -12 }],
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 24,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 3,
  },
  cropDragText: {
    color: '#fff',
    fontSize: 12,
    textAlign: 'center',
  },
  cropQuadrilateral: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 2,
  },
  cropEdge: {
    position: 'absolute',
    height: 2,
    backgroundColor: '#3B82F6',
    transformOrigin: 'left center',
    zIndex: 2,
  },
  captureIndicator: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(59, 130, 246, 0.8)',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    zIndex: 10,
  },
  captureIndicatorText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  // Capture styles
  captureContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: width,
    height: height,
    zIndex: -1, // Behind the interactive layer
  },
  captureImage: {
    width: '100%',
    height: '100%',
  },
  burnInOverlay: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderRadius: 8,
    padding: 12,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  burnInText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
}); 