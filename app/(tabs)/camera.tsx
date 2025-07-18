import * as React from 'react';
import type { LocationObject } from 'expo-location';
import type { CameraView as CameraViewType } from 'expo-camera';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Dimensions, TextInput, Modal, Image } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as FileSystem from 'expo-file-system';
import * as Location from 'expo-location';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Camera as CameraIcon, Folder, Hash, CheckCircle, MapPin, Clock } from 'lucide-react-native';
import { useRouter } from 'expo-router';

const { width, height } = Dimensions.get('window');

export default function CameraScreen() {
  const router = useRouter();
  const [facing, setFacing] = React.useState<'front' | 'back'>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [isCapturing, setIsCapturing] = React.useState(false);
  const [projectName, setProjectName] = React.useState('');
  const [ticketNumber, setTicketNumber] = React.useState('');
  const [showProjectInput, setShowProjectInput] = React.useState(false);
  const [showTicketInput, setShowTicketInput] = React.useState(false);
  const [timestamp, setTimestamp] = React.useState(new Date());
  const [location, setLocation] = React.useState<LocationObject | null>(null);
  const [locationPermission, requestLocationPermission] = Location.useForegroundPermissions();
  const cameraRef = React.useRef<CameraViewType>(null);
  const [lastPhotoUri, setLastPhotoUri] = React.useState<string | null>(null);
  const [showViewModal, setShowViewModal] = React.useState(false);

  // Update timestamp every second
  React.useEffect(() => {
    const interval = setInterval(() => setTimestamp(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Get location on mount and when permission changes
  React.useEffect(() => {
    if (locationPermission?.granted) {
      Location.getCurrentPositionAsync({})
        .then((loc) => setLocation(loc))
        .catch(() => setLocation(null));
    }
  }, [locationPermission]);

  const takePicture = async () => {
    if (!cameraRef.current || isCapturing) return;
    if (!projectName) {
      Alert.alert('Project required', 'Please enter a project name before capturing.');
      return;
    }
    try {
      setIsCapturing(true);
      const photo = await cameraRef.current?.takePictureAsync({ quality: 0.8 });
      if (photo) {
        // Navigate to CameraPreview instead of showing modal
        router.push({
          pathname: '/CameraPreview',
          params: {
            photoUri: photo.uri,
            location: location ? JSON.stringify({
              latitude: location.coords.latitude,
              longitude: location.coords.longitude
            }) : null,
            timestamp: new Date().toISOString(),
            projectName: projectName,
            ticketNumber: ticketNumber
          }
        });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to capture photo.');
    } finally {
      setIsCapturing(false);
    }
  };

  if (!permission) {
    return <View style={styles.container}><Text>Loading camera permissions...</Text></View>;
  }
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text>Camera permission is required</Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text>Grant Permissions</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Location permission prompt
  if (!locationPermission?.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionPromptContainer}>
          <Text style={styles.permissionPromptTitle}>Location Permission Needed</Text>
          <Text style={styles.permissionPromptText}>
            To tag your photos with location, please enable location access.
          </Text>
          <TouchableOpacity style={styles.permissionPromptButton} onPress={requestLocationPermission}>
            <Text style={styles.permissionPromptButtonText}>Enable Location</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const formatLocation = () => {
    if (!location) return 'Location unavailable';
    const { latitude, longitude } = location.coords;
    return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
  };
  const formatTimestamp = () => timestamp.toLocaleString();

  return (
    <SafeAreaView style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={facing}
      />
      {/* Meta info sticker at top left */}
      <View style={styles.metaStickerContainer}>
        <View style={styles.metaSticker}>
          <View style={styles.metaInfoRow}>
            <MapPin size={16} color="#fff" />
            <Text style={styles.metaText}>{formatLocation()}</Text>
          </View>
          <View style={styles.metaInfoRow}>
            <Clock size={16} color="#fff" style={{ marginLeft: 0 }} />
            <Text style={styles.metaText}>{formatTimestamp()}</Text>
          </View>
          {projectName ? <Text style={styles.metaProject}>{projectName}</Text> : null}
          {ticketNumber ? <Text style={styles.metaTicket}>{ticketNumber}</Text> : null}
        </View>
      </View>
      {/* Project and Ticket selection buttons */}
      
      <View style={styles.selectionRow}>
        <TouchableOpacity style={styles.selectionButton} onPress={() => setShowProjectInput(true)}>
          <Folder size={24} color="#3B82F6" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.captureButton}
          onPress={takePicture}
          disabled={isCapturing}
        >
          <CameraIcon size={32} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.selectionButton} onPress={() => setShowTicketInput(true)}>
          <Hash size={24} color="#3B82F6" />
        </TouchableOpacity>
      </View>
      
      {/* Project input modal */}
      <Modal visible={showProjectInput} transparent animationType="fade">
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
      </Modal>
      {/* Ticket input modal */}
      <Modal visible={showTicketInput} transparent animationType="fade">
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
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },
  selectionRow: {
    position: 'absolute',
    bottom: 160,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    zIndex: 20,
  },
  selectionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 18,
    marginHorizontal: 8,
    elevation: 4,
  },
  selectionText: {
    color: '#3B82F6',
    fontWeight: '700',
    fontSize: 16,
    marginLeft: 8,
  },
  selectedInfoRow: {
    position: 'absolute',
    bottom: 130,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    flexWrap: 'wrap',
  },
  selectedInfo: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginHorizontal: 12,
    backgroundColor: 'rgba(59,130,246,0.7)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  metaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  metaText: {
    color: '#fff',
    fontSize: 13,
    marginLeft: 4,
    marginRight: 4,
    opacity: 0.85,
  },
  bottomControls: {
    position: 'absolute',
    // bottom: 40, // replaced with dynamic offset
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  captureButton: {
    backgroundColor: '#3B82F6',
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  permissionButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  permissionPromptContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    padding: 32,
  },
  permissionPromptTitle: {
    color: '#3B82F6',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12,
  },
  permissionPromptText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    opacity: 0.85,
  },
  permissionPromptButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 10,
  },
  permissionPromptButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  inputOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  inputLabel: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  input: {
    width: 220,
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
  metaStickerContainer: {
    position: 'absolute',
    top: 24,
    left: 16,
    zIndex: 30,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  metaSticker: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 14,
    alignItems: 'flex-start',
    minWidth: 120,
  },
  metaInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  metaProject: {
    color: '#3B82F6',
    fontWeight: '700',
    fontSize: 14,
    marginTop: 4,
  },
  metaTicket: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
    marginTop: 2,
    opacity: 0.85,
  },
  viewPromptContainer: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 50,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 16,
    marginHorizontal: 40,
    padding: 18,
  },
  viewPromptText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 10,
  },
  viewPromptButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    paddingHorizontal: 18,
    paddingVertical: 8,
    marginBottom: 10,
  },
  viewPromptButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  viewImageModal: {
    width: 220,
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  viewImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
    backgroundColor: '#222',
  },
}); 