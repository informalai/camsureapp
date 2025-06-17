import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, Image, Modal, TextInput, Dimensions } from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Settings, Menu, Camera, RotateCcw } from 'lucide-react-native';
import * as Location from 'expo-location';
import Animated, { useSharedValue, useAnimatedStyle, useAnimatedGestureHandler } from 'react-native-reanimated';
import { PanGestureHandler, GestureHandlerRootView, PanGestureHandlerGestureEvent } from 'react-native-gesture-handler';
import { captureRef } from 'react-native-view-shot';
import AppStorage from '../../utils/storage';

const STICKERS = ['😀', '😎', '🥳', '😍', '🤔', '😴', '🔥', '💯', '👍', '❤️', '🎉', '⭐'];

type Sticker =
  | { id: string; type: 'emoji'; value: string; left: number; top: number }
  | { id: string; type: 'text'; value: string; left: number; top: number }
  | { id: string; type: 'location'; value: string; left: number; top: number };

export default function CameraTab() {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [isCameraActive, setIsCameraActive] = useState(true);
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [showTextModal, setShowTextModal] = useState(false);
  const [textValue, setTextValue] = useState('');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const compositeRef = useRef<View>(null);

  if (!permission) {
    return (
      <View style={styles.container}>
        <Text>Loading camera permissions...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionContainer}>
          <Camera size={80} color="#007AFF" />
          <Text style={styles.permissionTitle}>Camera Access Required</Text>
          <Text style={styles.permissionText}>
            CamSure needs access to your camera to take photos and videos
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  const saveToAppStorage = async (uri: string, hasStickers = false, stickerCount = 0) => {
    try {
      const metadata = await AppStorage.savePhoto(uri, hasStickers, stickerCount);
      return metadata !== null;
    } catch (error) {
      console.error('Error saving photo to app storage:', error);
      return false;
    }
  };

  const takePicture = async () => {
    if (cameraRef.current && !isSaving) {
      setIsSaving(true);
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: false,
          exif: false
        });
        
        setCapturedImage(photo.uri);
        console.log('Photo captured, ready for editing');
      } catch (error) {
        console.error('Error taking picture:', error);
        alert('Failed to take picture. Please try again.');
      } finally {
        setIsSaving(false);
      }
    }
  };

  const retakePicture = () => {
    setCapturedImage(null);
  };

  const toggleCamera = () => {
    setIsCameraActive(!isCameraActive);
  };

  const randomPos = () => ({
    top: 50 + Math.random() * 20, // percent
    left: 10 + Math.random() * 80,
  });

  const addEmojiSticker = (emoji: string) => {
    const { top, left } = randomPos();
    setStickers(prev => [...prev, { id: Date.now().toString(), type: 'emoji', value: emoji, top, left }]);
  };

  const addTextSticker = () => {
    if (!textValue.trim()) return;
    const { top, left } = randomPos();
    setStickers(prev => [...prev, { id: Date.now().toString(), type: 'text', value: textValue.trim(), top, left }]);
    setTextValue('');
    setShowTextModal(false);
  };

  const addLocationSticker = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      alert('Location permission required');
      return;
    }
    try {
      const loc = await Location.getCurrentPositionAsync({});
      const [place] = await Location.reverseGeocodeAsync(loc.coords);
      const text = `${place?.name || ''} ${place?.city || ''}`.trim();
      if (text) {
        const { top, left } = randomPos();
        setStickers(prev => [...prev, { id: Date.now().toString(), type: 'location', value: text, top, left }]);
      }
    } catch (e) {
      console.warn('Cannot fetch location', e);
    }
  };

  const savePicture = async () => {
    if (!capturedImage) {
      alert('Take a picture first');
      return;
    }
    if (isSaving) return;
    
    setIsSaving(true);
    try {
      if (compositeRef.current == null) {
        alert('Nothing to save');
        setIsSaving(false);
        return;
      }
      
      const uri = await captureRef(compositeRef, { format: 'png', quality: 1 });
      const hasStickers = stickers.length > 0;
      const saved = await saveToAppStorage(uri, hasStickers, stickers.length);
      
      if (saved) {
        alert('Saved to CamSure gallery!');
        // Clear the captured image and stickers after saving
        setCapturedImage(null);
        setStickers([]);
      } else {
        alert('Failed to save photo');
      }
    } catch (e) {
      console.error('Save failed', e);
      alert('Save failed: ' + (e instanceof Error ? e.message : 'Unknown error'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton}>
          <Settings size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>CamSure</Text>
        <TouchableOpacity style={styles.headerButton} onPress={capturedImage ? retakePicture : undefined}>
          {capturedImage ? <Text style={styles.retakeText}>Retake</Text> : <Menu size={24} color="#FFF" />}
        </TouchableOpacity>
      </View>

      {/* Camera View */}
      <View style={styles.cameraContainer}>
        {capturedImage ? (
          <View ref={compositeRef} collapsable={false} style={styles.cameraWrapper}>
            <Image 
              source={{ uri: capturedImage }} 
              style={styles.camera} 
              resizeMode="contain"
            />
            <View style={styles.overlayContainer} pointerEvents="auto">
              {stickers.map(stk => (
                <DraggableSticker key={stk.id} initialLeft={`${stk.left}%`} initialTop={`${stk.top}%`}>
                  {stk.type === 'emoji' ? (
                    <Text style={styles.stickerOverlay}>{stk.value}</Text>
                  ) : (
                    <View style={styles.textSticker}>
                      <Text style={styles.textStickerLabel}>{stk.value}</Text>
                    </View>
                  )}
                </DraggableSticker>
              ))}
            </View>
          </View>
        ) : isCameraActive ? (
          <View style={styles.cameraWrapper}>
            <CameraView 
              ref={cameraRef}
              style={styles.camera} 
              facing={facing}
            />
            {/* Sticker Overlays during live view */}
            <View style={styles.overlayContainer} pointerEvents="auto">
              {stickers.map(stk => (
                <DraggableSticker key={stk.id} initialLeft={`${stk.left}%`} initialTop={`${stk.top}%`}>
                  {stk.type === 'emoji' ? (
                    <Text style={styles.stickerOverlay}>{stk.value}</Text>
                  ) : (
                    <View style={styles.textSticker}>
                      <Text style={styles.textStickerLabel}>{stk.value}</Text>
                    </View>
                  )}
                </DraggableSticker>
              ))}
            </View>
          </View>
        ) : (
          <View style={styles.cameraOff}>
            <Camera size={80} color="#8E8E93" />
            <Text style={styles.cameraOffText}>Camera is off</Text>
            <TouchableOpacity style={styles.turnOnButton} onPress={toggleCamera}>
              <Text style={styles.turnOnButtonText}>Turn On Camera</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Sticker Panel */}
      <View style={styles.stickerPanel}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.stickerScrollView}
        >
          {/* Emoji buttons */}
          {STICKERS.map((sticker, index) => (
            <TouchableOpacity
              key={index}
              style={styles.stickerButton}
              onPress={() => addEmojiSticker(sticker)}
            >
              <Text style={styles.stickerText}>{sticker}</Text>
            </TouchableOpacity>
          ))}
          {/* Text sticker button */}
          <TouchableOpacity style={styles.stickerButton} onPress={() => setShowTextModal(true)}>
            <Text style={[styles.stickerText, { fontWeight: '700' }]}>Aa</Text>
          </TouchableOpacity>
          {/* Location sticker button */}
          <TouchableOpacity style={styles.stickerButton} onPress={addLocationSticker}>
            <Text style={styles.stickerText}>📍</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Bottom Controls */}
      <View style={styles.bottomControls}>
        <TouchableOpacity 
          style={[styles.controlButton, capturedImage ? { opacity: 0.5 } : {}]} 
          onPress={toggleCamera}
          disabled={!!capturedImage}
        >
          <Camera size={24} color="#FFF" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.captureButton}
          onPress={capturedImage ? retakePicture : takePicture}
        >
          <View style={[styles.captureButtonInner, capturedImage ? styles.retakeButton : {}]} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.controlButton}
          onPress={capturedImage ? savePicture : toggleCameraFacing}
          disabled={isSaving}
        >
          {capturedImage ? <Text style={styles.saveText}>Save</Text> : <RotateCcw size={24} color="#FFF" />}
        </TouchableOpacity>
      </View>

      {/* Text input modal */}
      <Modal visible={showTextModal} transparent animationType="fade">
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <TextInput
              placeholder="Enter text"
              placeholderTextColor="#888"
              style={styles.modalInput}
              value={textValue}
              onChangeText={setTextValue}
              autoFocus
            />
            <View style={{ flexDirection: 'row', marginTop: 12 }}>
              <TouchableOpacity style={styles.modalButton} onPress={() => setShowTextModal(false)}>
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, { backgroundColor: '#007AFF' }]} onPress={addTextSticker}>
                <Text style={[styles.modalButtonText, { color: '#FFF' }]}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </GestureHandlerRootView>
  );
}

// DraggableSticker component
function DraggableSticker({ children, initialLeft, initialTop }: { children: React.ReactNode; initialLeft: string | number; initialTop: string | number }) {
  // Convert percentage strings to pixel values
  const getPixelValue = (value: string | number, dimension: 'width' | 'height') => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string' && value.includes('%')) {
      const percentage = parseFloat(value.replace('%', ''));
      const { width, height } = Dimensions.get('window');
      return dimension === 'width' ? (percentage / 100) * width : (percentage / 100) * height;
    }
    return 0;
  };

  const translateX = useSharedValue(getPixelValue(initialLeft, 'width'));
  const translateY = useSharedValue(getPixelValue(initialTop, 'height'));

  type Context = { startX: number; startY: number };
  const gestureHandler = useAnimatedGestureHandler<PanGestureHandlerGestureEvent, Context>({
    onStart: (_, ctx) => {
      ctx.startX = translateX.value;
      ctx.startY = translateY.value;
    },
    onActive: (event, ctx) => {
      translateX.value = ctx.startX + event.translationX;
      translateY.value = ctx.startY + event.translationY;
    },
  });

  const animatedStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    left: translateX.value,
    top: translateY.value,
  }));

  return (
    <PanGestureHandler onGestureEvent={gestureHandler}>
      <Animated.View style={animatedStyle}>{children}</Animated.View>
    </PanGestureHandler>
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
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  headerButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
  },
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },
  cameraWrapper: {
    flex: 1,
    position: 'relative',
  },
  camera: {
    flex: 1,
    width: '100%',
    backgroundColor: '#000',
  },
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
    width: '100%',
    height: '100%',
  },
  cameraOff: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
  },
  cameraOffText: {
    fontSize: 18,
    color: '#8E8E93',
    marginTop: 16,
    marginBottom: 24,
  },
  turnOnButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  turnOnButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  stickerOverlay: {
    fontSize: 40,
    zIndex: 20,
  },
  textSticker: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  textStickerLabel: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '600',
  },
  stickerPanel: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingVertical: 15,
  },
  stickerScrollView: {
    paddingHorizontal: 20,
  },
  stickerButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  stickerText: {
    fontSize: 24,
  },
  bottomControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 30,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  controlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  captureButtonInner: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#FFF',
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  retakeButton: {
    backgroundColor: '#FF3B30',
  },
  retakeText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFF',
    marginTop: 20,
    marginBottom: 10,
  },
  permissionText: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 30,
  },
  permissionButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  permissionButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
  },
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '80%',
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 10,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 6,
    paddingHorizontal: 10,
    color: '#000',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    color: '#007AFF',
  },
  saveText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});