import React, { useRef, useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, TextInput, Dimensions, PanResponder } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CheckCircle, XCircle, Edit, Folder, Hash } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

export default function CameraPreview() {
  const router = useRouter();
  const { photoUri, location, timestamp } = useLocalSearchParams();

  // Sticker state
  const [stickerX, setStickerX] = useState(width * 0.1);
  const [stickerY, setStickerY] = useState(height * 0.6);
  const [stickerWidth, setStickerWidth] = useState(220);
  const [stickerHeight, setStickerHeight] = useState(80);
  const [dragging, setDragging] = useState(false);
  const [resizing, setResizing] = useState(false);

  // Sticker content state
  const [ticketNumber, setTicketNumber] = useState('');
  const [projectName, setProjectName] = useState('');
  const [showTicketInput, setShowTicketInput] = useState(false);
  const [showProjectInput, setShowProjectInput] = useState(false);

  // PanResponder for dragging
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => setDragging(true),
      onPanResponderMove: (evt, gestureState) => {
        setStickerX(Math.max(0, Math.min(stickerX + gestureState.dx, width - stickerWidth)));
        setStickerY(Math.max(0, Math.min(stickerY + gestureState.dy, height - stickerHeight - 100)));
      },
      onPanResponderRelease: () => setDragging(false),
    })
  ).current;

  // PanResponder for resizing (bottom-right corner)
  const resizeResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => setResizing(true),
      onPanResponderMove: (evt, gestureState) => {
        setStickerWidth(Math.max(120, stickerWidth + gestureState.dx));
        setStickerHeight(Math.max(40, stickerHeight + gestureState.dy));
      },
      onPanResponderRelease: () => setResizing(false),
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

  // Save handler (to be implemented: render sticker onto image and save)
  const handleSave = () => {
    // TODO: Render sticker onto image and save to gallery/project folder
    // For now, just go back to camera
    router.replace('/(tabs)/camera');
  };

  return (
    <SafeAreaView style={styles.container}>
      <Image source={{ uri: photoUri as string }} style={styles.photo} resizeMode="contain" />
      {/* Sticker overlay */}
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
            <Hash size={16} color="#fff" />
            <Text style={styles.stickerText}>{ticketNumber || 'Ticket #'}</Text>
            <TouchableOpacity onPress={() => setShowTicketInput(true)}>
              <Edit size={16} color="#fff" />
            </TouchableOpacity>
          </View>
          <View style={styles.stickerRow}>
            <Folder size={16} color="#fff" />
            <Text style={styles.stickerText}>{projectName || 'Project'}</Text>
            <TouchableOpacity onPress={() => setShowProjectInput(true)}>
              <Edit size={16} color="#fff" />
            </TouchableOpacity>
          </View>
          <View style={styles.stickerRow}>
            <Text style={styles.stickerTextSmall}>{formatLocation()}</Text>
            <Text style={styles.stickerTextSmall}>{formatTimestamp()}</Text>
          </View>
        </View>
        {/* Resize handle */}
        <View
          style={styles.resizeHandle}
          {...resizeResponder.panHandlers}
        />
      </View>
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
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
          <XCircle size={24} color="#fff" />
          <Text style={styles.buttonText}>Retake</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <CheckCircle size={24} color="#fff" />
          <Text style={styles.buttonText}>Save</Text>
        </TouchableOpacity>
      </View>
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
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 12,
    minWidth: 120,
    minHeight: 40,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    padding: 8,
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
}); 