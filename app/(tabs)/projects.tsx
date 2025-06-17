import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Modal, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Bell, Plus, Circle, Clock, CheckCircle, AlertCircle, User, Edit3, Save, X, Camera, Paperclip, ChevronDown, Users } from 'lucide-react-native';
import AppStorage, { PhotoMetadata } from '../../utils/storage';

interface Task {
  id: number;
  title: string;
  description: string;
  status: string;
  priority: string;
  assignee: string;
  project: string;
  attachments?: string[];
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
}

const TEAM_MEMBERS: TeamMember[] = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@camsure.com',
    role: 'Frontend Developer',
    avatar: '👨‍💻'
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane@camsure.com',
    role: 'UI/UX Designer',
    avatar: '👩‍🎨'
  },
  {
    id: '3',
    name: 'Mike Johnson',
    email: 'mike@camsure.com',
    role: 'Backend Developer',
    avatar: '👨‍💼'
  },
  {
    id: '4',
    name: 'Sarah Wilson',
    email: 'sarah@camsure.com',
    role: 'QA Engineer',
    avatar: '👩‍🔬'
  },
  {
    id: '5',
    name: 'Tom Brown',
    email: 'tom@camsure.com',
    role: 'Product Manager',
    avatar: '👨‍💻'
  },
  {
    id: 'unassigned',
    name: 'Unassigned',
    email: '',
    role: '',
    avatar: '👤'
  }
];

const INITIAL_TASKS: Task[] = [
  {
    id: 1,
    title: 'Design new camera UI',
    description: 'Create mockups for the updated camera interface with sticker functionality',
    status: 'In Progress',
    priority: 'High',
    assignee: 'John Doe',
    project: 'CamSure Mobile',
    attachments: [],
  },
  {
    id: 2,
    title: 'Implement gallery filters',
    description: 'Add filter functionality to the photo gallery',
    status: 'To Do',
    priority: 'Medium',
    assignee: 'Jane Smith',
    project: 'CamSure Mobile',
    attachments: [],
  },
  {
    id: 3,
    title: 'User authentication flow',
    description: 'Set up login and registration system',
    status: 'Done',
    priority: 'High',
    assignee: 'Mike Johnson',
    project: 'CamSure Mobile',
    attachments: [],
  },
  {
    id: 4,
    title: 'Performance optimization',
    description: 'Optimize app performance and reduce loading times',
    status: 'In Progress',
    priority: 'Medium',
    assignee: 'Sarah Wilson',
    project: 'CamSure Mobile',
    attachments: [],
  },
  {
    id: 5,
    title: 'Add dark mode support',
    description: 'Implement dark mode theme throughout the app',
    status: 'To Do',
    priority: 'Low',
    assignee: 'Tom Brown',
    project: 'CamSure Mobile',
    attachments: [],
  },
];

export default function ProjectsTab() {
  const [searchQuery, setSearchQuery] = useState('');
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showGalleryModal, setShowGalleryModal] = useState(false);
  const [showAssigneeModal, setShowAssigneeModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [galleryPhotos, setGalleryPhotos] = useState<PhotoMetadata[]>([]);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    status: '',
    priority: '',
    assignee: '',
    project: '',
  });
  const [createForm, setCreateForm] = useState({
    title: '',
    description: '',
    status: 'To Do',
    priority: 'Medium',
    assignee: '',
    project: 'CamSure Mobile',
  });
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);

  const loadGalleryPhotos = async () => {
    console.log('🔄 Loading gallery photos...');
    setGalleryLoading(true);
    try {
      const photos = await AppStorage.getAllPhotos();
      console.log('📷 Gallery photos loaded:', photos.length);
      console.log('📷 First photo sample:', photos[0]);
      setGalleryPhotos(photos);
      console.log('✅ Gallery photos state updated');
    } catch (error) {
      console.error('❌ Error loading gallery photos:', error);
      Alert.alert('Error', 'Failed to load gallery photos');
    } finally {
      setGalleryLoading(false);
      console.log('🏁 Gallery loading finished');
    }
  };

  const startEditTask = (task: Task) => {
    setEditingTask(task);
    setEditForm({
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      assignee: task.assignee,
      project: task.project,
    });
    setShowEditModal(true);
  };

  const saveTask = () => {
    if (!editingTask) return;
    
    const updatedTask = { 
      ...editingTask, 
      ...editForm,
      // Preserve attachments from editingTask
      attachments: editingTask.attachments || []
    };
    
    const updatedTasks = tasks.map(task => 
      task.id === editingTask.id ? updatedTask : task
    );
    
    setTasks(updatedTasks);
    setShowEditModal(false);
    setEditingTask(null);
    // Clear the form
    setEditForm({
      title: '',
      description: '',
      status: '',
      priority: '',
      assignee: '',
      project: '',
    });
  };

  const attachPhoto = async (photoUri: string) => {
    console.log('📎 Attempting to attach photo:', photoUri);
    console.log('📝 Current editing task:', editingTask?.id);
    
    if (!editingTask) {
      console.log('❌ No editing task found');
      Alert.alert('Error', 'No task selected for editing');
      return;
    }
    
    const updatedTask = { 
      ...editingTask, 
      attachments: [...(editingTask.attachments || []), photoUri]
    };
    
    console.log('🔄 Updated task with attachment:', updatedTask);
    
    const updatedTasks = tasks.map(task => 
      task.id === editingTask.id ? updatedTask : task
    );
    
    setTasks(updatedTasks);
    setEditingTask(updatedTask); // Keep editingTask in sync
    setShowGalleryModal(false);
    console.log('✅ Photo attached successfully');
    console.log('🔙 Returning to edit modal');
    Alert.alert('Success', 'Photo attached to task!');
  };

  const removeAttachment = (taskId: number, attachmentIndex: number) => {
    const updatedTasks = tasks.map(task => 
      task.id === taskId 
        ? { 
            ...task, 
            attachments: task.attachments?.filter((_, index) => index !== attachmentIndex)
          }
        : task
    );
    setTasks(updatedTasks);
    
    // If we're currently editing this task, update editingTask too
    if (editingTask && editingTask.id === taskId) {
      setEditingTask({
        ...editingTask,
        attachments: editingTask.attachments?.filter((_, index) => index !== attachmentIndex)
      });
    }
  };

  const closeGalleryModal = () => {
    console.log('🔙 Closing gallery modal');
    setShowGalleryModal(false);
    // Don't clear editingTask - we want to return to the edit modal
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingTask(null);
    setEditForm({
      title: '',
      description: '',
      status: '',
      priority: '',
      assignee: '',
      project: '',
    });
  };

  const viewImage = (imageUri: string) => {
    setSelectedImageUri(imageUri);
  };

  const closeImageViewer = () => {
    setSelectedImageUri(null);
  };

  const selectAssignee = (member: TeamMember) => {
    if (isCreatingTask) {
      setCreateForm({ ...createForm, assignee: member.name });
      console.log('👤 Assignee selected for new task:', member.name);
    } else {
      setEditForm({ ...editForm, assignee: member.name });
      console.log('👤 Assignee selected for edit:', member.name);
    }
    setShowAssigneeModal(false);
  };

  const openAssigneeModal = () => {
    console.log('👥 Opening assignee modal');
    setShowAssigneeModal(true);
  };

  const closeAssigneeModal = () => {
    console.log('❌ Closing assignee modal');
    setShowAssigneeModal(false);
  };

  const getAssigneeInfo = (assigneeName: string) => {
    return TEAM_MEMBERS.find(member => member.name === assigneeName) || TEAM_MEMBERS.find(member => member.id === 'unassigned');
  };

  const startCreateTask = () => {
    console.log('➕ Starting new task creation');
    setIsCreatingTask(true);
    setCreateForm({
      title: '',
      description: '',
      status: 'To Do',
      priority: 'Medium',
      assignee: '',
      project: 'CamSure Mobile',
    });
    setShowCreateModal(true);
  };

  const createNewTask = () => {
    if (!createForm.title.trim()) {
      Alert.alert('Error', 'Task title is required');
      return;
    }

    const newTask: Task = {
      id: Date.now(), // Simple ID generation
      title: createForm.title.trim(),
      description: createForm.description.trim(),
      status: createForm.status,
      priority: createForm.priority,
      assignee: createForm.assignee,
      project: createForm.project.trim(),
      attachments: [],
    };

    console.log('🆕 Creating new task:', newTask);
    setTasks(prev => [newTask, ...prev]);
    setShowCreateModal(false);
    setIsCreatingTask(false);
    Alert.alert('Success', 'New task created successfully!');
  };

  const closeCreateModal = () => {
    console.log('❌ Closing create modal');
    setShowCreateModal(false);
    setIsCreatingTask(false);
    setCreateForm({
      title: '',
      description: '',
      status: 'To Do',
      priority: 'Medium',
      assignee: '',
      project: 'CamSure Mobile',
    });
  };

  const selectAssigneeForCreate = (member: TeamMember) => {
    setCreateForm({ ...createForm, assignee: member.name });
    setShowAssigneeModal(false);
    console.log('👤 Assignee selected for new task:', member.name);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'To Do':
        return <Circle size={16} color="#8E8E93" />;
      case 'In Progress':
        return <Clock size={16} color="#FF9500" />;
      case 'Done':
        return <CheckCircle size={16} color="#34C759" />;
      default:
        return <Circle size={16} color="#8E8E93" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'To Do':
        return '#8E8E93';
      case 'In Progress':
        return '#FF9500';
      case 'Done':
        return '#34C759';
      default:
        return '#8E8E93';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High':
        return '#FF3B30';
      case 'Medium':
        return '#FF9500';
      case 'Low':
        return '#34C759';
      default:
        return '#8E8E93';
    }
  };

  const filteredTasks = tasks.filter(task =>
    task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    task.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Projects</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton}>
            <Bell size={24} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton} onPress={startCreateTask}>
            <Plus size={24} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={20} color="#8E8E93" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search tasks..."
            placeholderTextColor="#8E8E93"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Task List */}
      <ScrollView style={styles.taskList} showsVerticalScrollIndicator={false}>
        {filteredTasks.map((task) => (
          <View key={task.id} style={styles.taskCard}>
            <View style={styles.taskHeader}>
              <Text style={styles.taskTitle}>{task.title}</Text>
              <View style={styles.taskActions}>
                <View style={styles.priorityBadge}>
                  <AlertCircle size={12} color={getPriorityColor(task.priority)} />
                  <Text style={[styles.priorityText, { color: getPriorityColor(task.priority) }]}>
                    {task.priority}
                  </Text>
                </View>
                <TouchableOpacity 
                  style={styles.editButton}
                  onPress={() => startEditTask(task)}
                >
                  <Edit3 size={16} color="#007AFF" />
                </TouchableOpacity>
              </View>
            </View>
            
            <Text style={styles.taskDescription}>{task.description}</Text>
            
            {/* Attachments */}
            {task.attachments && task.attachments.length > 0 && (
              <View style={styles.attachmentsContainer}>
                <View style={styles.attachmentsHeader}>
                  <Paperclip size={14} color="#8E8E93" />
                  <Text style={styles.attachmentsLabel}>Attachments ({task.attachments.length})</Text>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.attachmentsList}>
                  {task.attachments.map((attachment, index) => (
                    <TouchableOpacity 
                      key={index} 
                      style={styles.attachmentItem}
                      onPress={() => viewImage(attachment)}
                    >
                      <Image source={{ uri: attachment }} style={styles.attachmentImage} />
                      <TouchableOpacity 
                        style={styles.removeAttachmentButton}
                        onPress={(e) => {
                          e.stopPropagation();
                          removeAttachment(task.id, index);
                        }}
                      >
                        <X size={12} color="#FF3B30" />
                      </TouchableOpacity>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
            
            <View style={styles.taskMeta}>
              <View style={styles.statusContainer}>
                {getStatusIcon(task.status)}
                <Text style={[styles.statusText, { color: getStatusColor(task.status) }]}>
                  {task.status}
                </Text>
              </View>
              
              <View style={styles.assigneeContainer}>
                <User size={14} color="#8E8E93" />
                <Text style={styles.assigneeText}>{task.assignee}</Text>
              </View>
            </View>
            
            <View style={styles.projectTag}>
              <Text style={styles.projectTagText}>{task.project}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Stats Summary */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{tasks.filter(t => t.status === 'To Do').length}</Text>
          <Text style={styles.statLabel}>To Do</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{tasks.filter(t => t.status === 'In Progress').length}</Text>
          <Text style={styles.statLabel}>In Progress</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{tasks.filter(t => t.status === 'Done').length}</Text>
          <Text style={styles.statLabel}>Done</Text>
        </View>
      </View>

      {/* Edit Task Modal */}
      <Modal visible={showEditModal && !showGalleryModal && !showAssigneeModal && !showCreateModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={closeEditModal}>
              <X size={24} color="#007AFF" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Edit Task</Text>
            <TouchableOpacity onPress={saveTask}>
              <Save size={24} color="#007AFF" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.editForm}>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Title</Text>
              <TextInput
                style={styles.formInput}
                value={editForm.title}
                onChangeText={(text) => setEditForm({...editForm, title: text})}
                placeholder="Task title"
                placeholderTextColor="#8E8E93"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Description</Text>
              <TextInput
                style={[styles.formInput, styles.textArea]}
                value={editForm.description}
                onChangeText={(text) => setEditForm({...editForm, description: text})}
                placeholder="Task description"
                placeholderTextColor="#8E8E93"
                multiline
                numberOfLines={4}
              />
            </View>

            <View style={styles.formRow}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Status</Text>
                <View style={styles.pickerContainer}>
                  {['To Do', 'In Progress', 'Done'].map((status) => (
                    <TouchableOpacity
                      key={status}
                      style={[
                        styles.pickerOption,
                        editForm.status === status && styles.pickerOptionSelected
                      ]}
                      onPress={() => setEditForm({...editForm, status})}
                    >
                      <Text style={[
                        styles.pickerOptionText,
                        editForm.status === status && styles.pickerOptionTextSelected
                      ]}>
                        {status}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Priority</Text>
                <View style={styles.pickerContainer}>
                  {['Low', 'Medium', 'High'].map((priority) => (
                    <TouchableOpacity
                      key={priority}
                      style={[
                        styles.pickerOption,
                        editForm.priority === priority && styles.pickerOptionSelected
                      ]}
                      onPress={() => setEditForm({...editForm, priority})}
                    >
                      <Text style={[
                        styles.pickerOptionText,
                        editForm.priority === priority && styles.pickerOptionTextSelected
                      ]}>
                        {priority}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Assignee</Text>
              <TouchableOpacity style={styles.assigneeSelector} onPress={openAssigneeModal}>
                <View style={styles.assigneeInfo}>
                  <Text style={styles.assigneeAvatar}>
                    {getAssigneeInfo(editForm.assignee)?.avatar || '👤'}
                  </Text>
                  <View style={styles.assigneeDetails}>
                    <Text style={styles.assigneeName}>
                      {editForm.assignee || 'Select Assignee'}
                    </Text>
                    {editForm.assignee && getAssigneeInfo(editForm.assignee)?.role && (
                      <Text style={styles.assigneeRole}>
                        {getAssigneeInfo(editForm.assignee)?.role}
                      </Text>
                    )}
                  </View>
                </View>
                <ChevronDown size={20} color="#8E8E93" />
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Project</Text>
              <TextInput
                style={styles.formInput}
                value={editForm.project}
                onChangeText={(text) => setEditForm({...editForm, project: text})}
                placeholder="Project name"
                placeholderTextColor="#8E8E93"
              />
            </View>

            {/* Current Attachments */}
            {editingTask?.attachments && editingTask.attachments.length > 0 && (
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Current Attachments ({editingTask.attachments.length})</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.editAttachmentsList}>
                  {editingTask.attachments.map((attachment, index) => (
                    <TouchableOpacity 
                      key={index} 
                      style={styles.editAttachmentItem}
                      onPress={() => viewImage(attachment)}
                    >
                      <Image source={{ uri: attachment }} style={styles.editAttachmentImage} />
                      <TouchableOpacity 
                        style={styles.removeAttachmentButton}
                        onPress={(e) => {
                          e.stopPropagation();
                          removeAttachment(editingTask.id, index);
                        }}
                      >
                        <X size={12} color="#FF3B30" />
                      </TouchableOpacity>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            <TouchableOpacity 
              style={styles.attachPhotoButton}
              onPress={async () => {
                console.log('🎯 Attach Photo button pressed');
                console.log('📝 EditingTask ID:', editingTask?.id);
                console.log('📊 Current modals state:', { showEditModal, showGalleryModal });
                console.log('🔓 Setting gallery modal visible...');
                setShowGalleryModal(true);
                console.log('📱 Gallery modal state set to true');
                await loadGalleryPhotos();
              }}
            >
              <Camera size={20} color="#007AFF" />
              <Text style={styles.attachPhotoText}>Attach Photo from Gallery</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Create Task Modal */}
      <Modal visible={showCreateModal && !showGalleryModal && !showAssigneeModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={closeCreateModal}>
              <X size={24} color="#007AFF" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Create New Task</Text>
            <TouchableOpacity onPress={createNewTask}>
              <Save size={24} color="#007AFF" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.editForm}>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Title *</Text>
              <TextInput
                style={styles.formInput}
                value={createForm.title}
                onChangeText={(text) => setCreateForm({...createForm, title: text})}
                placeholder="Enter task title"
                placeholderTextColor="#8E8E93"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Description</Text>
              <TextInput
                style={[styles.formInput, styles.textArea]}
                value={createForm.description}
                onChangeText={(text) => setCreateForm({...createForm, description: text})}
                placeholder="Enter task description"
                placeholderTextColor="#8E8E93"
                multiline
                numberOfLines={4}
              />
            </View>

            <View style={styles.formRow}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Status</Text>
                <View style={styles.pickerContainer}>
                  {['To Do', 'In Progress', 'Done'].map((status) => (
                    <TouchableOpacity
                      key={status}
                      style={[
                        styles.pickerOption,
                        createForm.status === status && styles.pickerOptionSelected
                      ]}
                      onPress={() => setCreateForm({...createForm, status})}
                    >
                      <Text style={[
                        styles.pickerOptionText,
                        createForm.status === status && styles.pickerOptionTextSelected
                      ]}>
                        {status}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Priority</Text>
                <View style={styles.pickerContainer}>
                  {['Low', 'Medium', 'High'].map((priority) => (
                    <TouchableOpacity
                      key={priority}
                      style={[
                        styles.pickerOption,
                        createForm.priority === priority && styles.pickerOptionSelected
                      ]}
                      onPress={() => setCreateForm({...createForm, priority})}
                    >
                      <Text style={[
                        styles.pickerOptionText,
                        createForm.priority === priority && styles.pickerOptionTextSelected
                      ]}>
                        {priority}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Assignee</Text>
              <TouchableOpacity style={styles.assigneeSelector} onPress={openAssigneeModal}>
                <View style={styles.assigneeInfo}>
                  <Text style={styles.assigneeAvatar}>
                    {getAssigneeInfo(createForm.assignee)?.avatar || '👤'}
                  </Text>
                  <View style={styles.assigneeDetails}>
                    <Text style={styles.assigneeName}>
                      {createForm.assignee || 'Select Assignee'}
                    </Text>
                    {createForm.assignee && getAssigneeInfo(createForm.assignee)?.role && (
                      <Text style={styles.assigneeRole}>
                        {getAssigneeInfo(createForm.assignee)?.role}
                      </Text>
                    )}
                  </View>
                </View>
                <ChevronDown size={20} color="#8E8E93" />
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Project</Text>
              <TextInput
                style={styles.formInput}
                value={createForm.project}
                onChangeText={(text) => setCreateForm({...createForm, project: text})}
                placeholder="Project name"
                placeholderTextColor="#8E8E93"
              />
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Gallery Modal */}
      <Modal 
        visible={showGalleryModal} 
        animationType="slide" 
        presentationStyle="fullScreen"
        transparent={false}
      >
        <SafeAreaView style={styles.galleryModalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => {
              console.log('❌ Gallery modal close pressed');
              closeGalleryModal();
            }}>
              <X size={24} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>📸 Select Photo ({galleryPhotos.length} photos)</Text>
            <View style={{width: 24}} />
          </View>
          
          {/* Debug visibility indicator */}
          <View style={{backgroundColor: '#FF0000', padding: 5, margin: 10}}>
            <Text style={{color: '#FFF', textAlign: 'center', fontSize: 12}}>
              MODAL VISIBLE - {galleryPhotos.length} photos
            </Text>
          </View>

          <ScrollView style={styles.galleryContainer}>
            {galleryLoading ? (
              <View style={styles.emptyGallery}>
                <Text style={styles.emptyGalleryText}>Loading photos...</Text>
              </View>
            ) : (
              <>
                {console.log('🎨 Rendering gallery grid with', galleryPhotos.length, 'photos')}
                <View style={styles.galleryGrid}>
                  {galleryPhotos.map((photo, index) => {
                    console.log(`🖼️ Rendering photo ${index + 1}:`, photo.id);
                    return (
                      <TouchableOpacity
                        key={photo.id}
                        style={styles.galleryItem}
                        onPress={() => {
                          console.log('🖼️ Photo selected:', photo.id, photo.uri);
                          attachPhoto(photo.uri);
                        }}
                      >
                        <Image 
                          source={{ uri: photo.uri }} 
                          style={styles.galleryImage}
                          onLoad={() => console.log('✅ Image loaded:', photo.id)}
                          onError={(error) => console.log('❌ Image error:', photo.id, error)}
                        />
                      </TouchableOpacity>
                    );
                  })}
                </View>
                {galleryPhotos.length === 0 && (
                  <View style={styles.emptyGallery}>
                    <Camera size={48} color="#8E8E93" />
                    <Text style={styles.emptyGalleryText}>No photos in gallery</Text>
                    <Text style={styles.emptyGallerySubtext}>Take some photos first!</Text>
                  </View>
                )}
              </>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Assignee Modal */}
      <Modal 
        visible={showAssigneeModal} 
        animationType="slide" 
        presentationStyle="formSheet"
        transparent={false}
      >
        <SafeAreaView style={styles.assigneeModalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={closeAssigneeModal}>
              <X size={24} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>👥 Assign To</Text>
            <View style={{width: 24}} />
          </View>
          
          <ScrollView style={styles.assigneeList}>
            {TEAM_MEMBERS.map((member) => (
              <TouchableOpacity
                key={member.id}
                style={[
                  styles.assigneeItem,
                  (isCreatingTask ? createForm.assignee : editForm.assignee) === member.name && styles.assigneeItemSelected
                ]}
                onPress={() => selectAssignee(member)}
              >
                <View style={styles.assigneeItemContent}>
                  <Text style={styles.assigneeItemAvatar}>{member.avatar}</Text>
                  <View style={styles.assigneeItemDetails}>
                    <Text style={styles.assigneeItemName}>{member.name}</Text>
                    {member.role && (
                      <Text style={styles.assigneeItemRole}>{member.role}</Text>
                    )}
                    {member.email && (
                      <Text style={styles.assigneeItemEmail}>{member.email}</Text>
                    )}
                  </View>
                </View>
                {(isCreatingTask ? createForm.assignee : editForm.assignee) === member.name && (
                  <CheckCircle size={20} color="#007AFF" />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Image Viewer Modal */}
      <Modal visible={!!selectedImageUri} animationType="fade" presentationStyle="overFullScreen">
        <View style={styles.imageViewerContainer}>
          <TouchableOpacity style={styles.imageViewerClose} onPress={closeImageViewer}>
            <X size={30} color="#FFF" />
          </TouchableOpacity>
          {selectedImageUri && (
            <Image 
              source={{ uri: selectedImageUri }} 
              style={styles.fullScreenImage} 
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
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
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    padding: 8,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
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
  taskList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  taskCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  taskActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editButton: {
    padding: 4,
  },
  taskTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
    flex: 1,
    marginRight: 12,
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '500',
  },
  taskDescription: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 20,
    marginBottom: 12,
  },
  taskMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  assigneeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  assigneeText: {
    fontSize: 14,
    color: '#8E8E93',
  },
  projectTag: {
    alignSelf: 'flex-start',
    backgroundColor: '#007AFF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  projectTagText: {
    fontSize: 12,
    color: '#FFF',
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#1C1C1E',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFF',
  },
  statLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 4,
  },
  attachmentsContainer: {
    marginBottom: 12,
  },
  attachmentsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  attachmentsLabel: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
  },
  attachmentsList: {
    marginLeft: 20,
  },
  attachmentItem: {
    width: 60,
    height: 60,
    marginRight: 8,
    position: 'relative',
  },
  attachmentImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    backgroundColor: '#1C1C1E',
  },
  removeAttachmentButton: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#000',
    position: 'relative',
    zIndex: 1000,
  },
  galleryModalContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#1C1C1E',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
  },
  editForm: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  formRow: {
    flexDirection: 'row',
    gap: 16,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: '#1C1C1E',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#FFF',
    borderWidth: 1,
    borderColor: '#2C2C2E',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  pickerOption: {
    flex: 1,
    backgroundColor: '#1C1C1E',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#2C2C2E',
    alignItems: 'center',
  },
  pickerOptionSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  pickerOptionText: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
  },
  pickerOptionTextSelected: {
    color: '#FFF',
  },
  attachPhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1C1C1E',
    borderRadius: 8,
    paddingVertical: 16,
    gap: 8,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  attachPhotoText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  galleryContainer: {
    flex: 1,
    backgroundColor: '#000',
    paddingTop: 10,
  },
  galleryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: 16,
  },
  galleryItem: {
    width: '31%',
    aspectRatio: 1,
    marginBottom: 16,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#1C1C1E',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  galleryImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#1C1C1E',
  },
  emptyGallery: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyGalleryText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyGallerySubtext: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
  },
  editAttachmentsList: {
    marginTop: 8,
  },
  editAttachmentItem: {
    width: 80,
    height: 80,
    marginRight: 12,
    position: 'relative',
  },
  editAttachmentImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    backgroundColor: '#1C1C1E',
  },
  imageViewerContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageViewerClose: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 10,
  },
  fullScreenImage: {
    width: '90%',
    height: '80%',
  },
  assigneeSelector: {
    backgroundColor: '#1C1C1E',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#2C2C2E',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  assigneeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  assigneeAvatar: {
    fontSize: 24,
    marginRight: 12,
  },
  assigneeDetails: {
    flex: 1,
  },
  assigneeName: {
    fontSize: 16,
    color: '#FFF',
    fontWeight: '500',
  },
  assigneeRole: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  assigneeModalContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  assigneeList: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  assigneeItem: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  assigneeItemSelected: {
    backgroundColor: '#2C2C2E',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  assigneeItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  assigneeItemAvatar: {
    fontSize: 32,
    marginRight: 16,
  },
  assigneeItemDetails: {
    flex: 1,
  },
  assigneeItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 2,
  },
  assigneeItemRole: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 2,
  },
  assigneeItemEmail: {
    fontSize: 12,
    color: '#6D6D70',
  },
});