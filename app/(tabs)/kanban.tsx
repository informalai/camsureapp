import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Kanban as KanbanIcon, Plus, CheckCircle, Clock, AlertCircle, User, MapPin, FileText, MessageSquare, Filter as FilterIcon } from 'lucide-react-native';
import guaDataRaw from '../data/gua-data.json';
import DateTimePicker from '@react-native-community/datetimepicker';

// Type for a Kanban task
interface Task {
  id: string;
  leaseName: string;
  area: string;
  documentName: string;
  conditionType: string;
  conditionText: string;
  column: string;
  assignedTo: string;
  priority: number;
  deadline: string;
  evidence: any[];
  comments: any[];
}

// Type for guaData (deeply nested, so use any for now)
const guaData: any = guaDataRaw;

// Flatten the data once in memory for performance
const FLATTENED_TASKS: Task[] = (() => {
  const tasks: Task[] = [];
  const colCounts: Record<string, number> = {
    assigned: 0,
    'in-progress': 0,
    'evidence-submitted': 0,
    completed: 0,
    rejected: 0,
  };
  Object.entries(guaData).forEach(([leaseName, areas]: [string, any]) => {
    Object.entries(areas).forEach(([area, docs]: [string, any]) => {
      Object.entries(docs).forEach(([documentName, condTypes]: [string, any]) => {
        Object.entries(condTypes).forEach(([conditionType, conditions]: [string, any]) => {
          (conditions as string[]).forEach((conditionText: string, idx: number) => {
            // Random date between -10 and +10 days from now
            const offsetDays = Math.floor(Math.random() * 21) - 10;
            const deadlineDate = new Date(Date.now() + offsetDays * 86400000);
            // Random column
            const col = ['assigned', 'in-progress', 'evidence-submitted', 'completed', 'rejected'][Math.floor(Math.random()*5)];
            if (colCounts[col] < 2) {
              colCounts[col]++;
              tasks.push({
                id: `${leaseName}-${area}-${documentName}-${conditionType}-${idx}`,
                leaseName,
                area,
                documentName,
                conditionType,
                conditionText,
                column: col,
                assignedTo: ['John', 'Priya', 'Amit', 'Sara'][Math.floor(Math.random()*4)],
                priority: [1,2,3][Math.floor(Math.random()*3)],
                deadline: deadlineDate.toISOString().split('T')[0],
                evidence: [],
                comments: [],
              });
            }
          });
        });
      });
    });
  });
  return tasks;
})();

const columns = [
  { id: 'assigned', title: 'Assigned', color: '#3B82F6' },
  { id: 'in-progress', title: 'In Progress', color: '#F59E0B' },
  { id: 'evidence-submitted', title: 'Evidence Submitted', color: '#8B5CF6' },
  { id: 'completed', title: 'Completed', color: '#10B981' },
  { id: 'rejected', title: 'Rejected', color: '#EF4444' },
];

// Helper functions for dynamic dropdowns
const getAvailableAreas = (leaseName: string): string[] => leaseName ? Object.keys(guaData[leaseName] || {}) : [];
const getAvailableDocuments = (leaseName: string, area: string): string[] => leaseName && area ? Object.keys(guaData[leaseName]?.[area] || {}) : [];
const getAvailableConditionTypes = (leaseName: string, area: string, documentName: string): string[] => leaseName && area && documentName ? Object.keys(guaData[leaseName]?.[area]?.[documentName] || {}) : [];
const getAvailableShortenedConditions = (leaseName: string, area: string, documentName: string, conditionType: string): string[] => {
  if (!leaseName || !area || !documentName || !conditionType) return [];
  const arr = guaData[leaseName]?.[area]?.[documentName]?.[conditionType];
  return Array.isArray(arr) ? arr : [];
};

export default function KanbanScreen() {
  const [tasks, setTasks] = useState<Task[]>(FLATTENED_TASKS);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showNewTask, setShowNewTask] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  // JIRA-like new task state
  const [newTask, setNewTask] = useState({
    leaseName: '',
    area: '',
    documentName: '',
    conditionType: '',
    shortenedConditionText: '',
    conditionText: '',
    priority: 2,
    assignedTo: '',
    deadline: '',
    column: 'assigned',
  });
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Stats
  const filteredTasks = useMemo(() => {
    if (!searchTerm) return tasks;
    return tasks.filter(t =>
      t.conditionText.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.leaseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.area.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.documentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.conditionType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.assignedTo.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [tasks, searchTerm]);
  const overdueCount = useMemo(() => filteredTasks.filter(t => new Date(t.deadline) < new Date() && t.column !== 'completed').length, [filteredTasks]);
  const dueThisWeek = useMemo(() => filteredTasks.filter(t => {
    const d = new Date(t.deadline);
    const now = new Date();
    const days = (d.getTime() - now.getTime()) / 86400000;
    return days >= 0 && days <= 7;
  }).length, [filteredTasks]);
  const evidencePending = useMemo(() => filteredTasks.filter(t => !t.evidence || t.evidence.length === 0).length, [filteredTasks]);
  const completionRate = useMemo(() => Math.round((filteredTasks.filter(t => t.column === 'completed').length / (filteredTasks.length || 1)) * 100), [filteredTasks]);

  // Modal for task details
  const renderTaskModal = () => {
    if (!selectedTask) return null;
    return (
      <Modal visible transparent animationType="fade" onRequestClose={() => setSelectedTask(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity style={styles.modalClose} onPress={() => setSelectedTask(null)}>
              <Text style={{ color: '#fff', fontSize: 22 }}>×</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{selectedTask.conditionText}</Text>
            <Text style={styles.modalLabel}>Lease: <Text style={styles.modalValue}>{selectedTask.leaseName}</Text></Text>
            <Text style={styles.modalLabel}>Area: <Text style={styles.modalValue}>{selectedTask.area}</Text></Text>
            <Text style={styles.modalLabel}>Document: <Text style={styles.modalValue}>{selectedTask.documentName}</Text></Text>
            <Text style={styles.modalLabel}>Type: <Text style={styles.modalValue}>{selectedTask.conditionType}</Text></Text>
            <Text style={styles.modalLabel}>Assigned To: <Text style={styles.modalValue}>{selectedTask.assignedTo}</Text></Text>
            <Text style={styles.modalLabel}>Priority: <Text style={styles.modalValue}>{['High','Medium','Low'][selectedTask.priority-1]}</Text></Text>
            <Text style={styles.modalLabel}>Deadline: <Text style={styles.modalValue}>{selectedTask.deadline}</Text></Text>
            <Text style={styles.modalLabel}>Status: <Text style={styles.modalValue}>{selectedTask.column.replace('-', ' ')}</Text></Text>
          </View>
        </View>
      </Modal>
    );
  };

  // New Task Modal (JIRA-like, mobile-friendly)
  const renderNewTaskModal = () => (
    <Modal visible={showNewTask} transparent animationType="fade" onRequestClose={() => setShowNewTask(false)}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { width: '100%', maxWidth: 420, minHeight: 480 }]}> 
          <TouchableOpacity style={styles.modalClose} onPress={() => setShowNewTask(false)}>
            <Text style={{ color: '#fff', fontSize: 22 }}>×</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Create New Task</Text>
          {/* Lease Name */}
          <Text style={styles.modalLabel}>Lease Name *</Text>
          <View style={styles.pickerRow}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {Object.keys(guaData).map(lease => (
                <TouchableOpacity
                  key={lease}
                  style={[styles.pickerOption, newTask.leaseName === lease && styles.pickerOptionSelected]}
                  onPress={() => setNewTask({ ...newTask, leaseName: lease, area: '', documentName: '', conditionType: '', shortenedConditionText: '', conditionText: '' })}
                >
                  <Text style={{ color: newTask.leaseName === lease ? '#fff' : '#222' }}>{lease}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
          {/* Area */}
          <Text style={styles.modalLabel}>Area *</Text>
          <View style={styles.pickerRow}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {getAvailableAreas(newTask.leaseName).map(area => (
                <TouchableOpacity
                  key={area}
                  style={[styles.pickerOption, newTask.area === area && styles.pickerOptionSelected]}
                  onPress={() => setNewTask({ ...newTask, area, documentName: '', conditionType: '', shortenedConditionText: '', conditionText: '' })}
                  disabled={!newTask.leaseName}
                >
                  <Text style={{ color: newTask.area === area ? '#fff' : '#222' }}>{area}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
          {/* Document Name */}
          <Text style={styles.modalLabel}>Document *</Text>
          <View style={styles.pickerRow}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {getAvailableDocuments(newTask.leaseName, newTask.area).map(doc => (
                <TouchableOpacity
                  key={doc}
                  style={[styles.pickerOption, newTask.documentName === doc && styles.pickerOptionSelected]}
                  onPress={() => setNewTask({ ...newTask, documentName: doc, conditionType: '', shortenedConditionText: '', conditionText: '' })}
                  disabled={!newTask.area}
                >
                  <Text style={{ color: newTask.documentName === doc ? '#fff' : '#222' }}>{doc}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
          {/* Condition Type */}
          <Text style={styles.modalLabel}>Condition Type *</Text>
          <View style={styles.pickerRow}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {getAvailableConditionTypes(newTask.leaseName, newTask.area, newTask.documentName).map(type => (
                <TouchableOpacity
                  key={type}
                  style={[styles.pickerOption, newTask.conditionType === type && styles.pickerOptionSelected]}
                  onPress={() => setNewTask({ ...newTask, conditionType: type, shortenedConditionText: '', conditionText: '' })}
                  disabled={!newTask.documentName}
                >
                  <Text style={{ color: newTask.conditionType === type ? '#fff' : '#222' }}>{type}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
          {/* Condition Summary */}
          <Text style={styles.modalLabel}>Condition Summary *</Text>
          <View style={styles.pickerRow}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {getAvailableShortenedConditions(newTask.leaseName, newTask.area, newTask.documentName, newTask.conditionType).map(cond => (
                <TouchableOpacity
                  key={cond}
                  style={[styles.pickerOption, newTask.shortenedConditionText === cond && styles.pickerOptionSelected]}
                  onPress={() => setNewTask({ ...newTask, shortenedConditionText: cond, conditionText: cond })}
                  disabled={!newTask.conditionType}
                >
                  <Text style={{ color: newTask.shortenedConditionText === cond ? '#fff' : '#222' }}>{cond}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
          {/* Priority */}
          <Text style={styles.modalLabel}>Priority *</Text>
          <View style={styles.pickerRow}>
            {['High', 'Medium', 'Low'].map((label, idx) => (
              <TouchableOpacity
                key={label}
                style={[styles.pickerOption, newTask.priority === idx+1 && styles.pickerOptionSelected]}
                onPress={() => setNewTask({ ...newTask, priority: idx+1 })}
              >
                <Text style={{ color: newTask.priority === idx+1 ? '#fff' : '#222' }}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {/* Assigned To */}
          <Text style={styles.modalLabel}>Assigned To *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., John Smith"
            value={newTask.assignedTo}
            onChangeText={val => setNewTask({ ...newTask, assignedTo: val })}
          />
          {/* Deadline */}
          <Text style={styles.modalLabel}>Deadline</Text>
          <TouchableOpacity
            style={[styles.input, { flexDirection: 'row', alignItems: 'center' }]}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={{ color: newTask.deadline ? '#222' : '#888', fontSize: 15 }}>
              {newTask.deadline ? newTask.deadline : 'Pick a date'}
            </Text>
            <Clock size={18} color="#6B7280" style={{ marginLeft: 8 }} />
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={newTask.deadline ? new Date(newTask.deadline) : new Date()}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                setShowDatePicker(false);
                if (selectedDate) {
                  setNewTask({ ...newTask, deadline: selectedDate.toISOString().split('T')[0] });
                }
              }}
            />
          )}
          {/* Column (Status) */}
          <Text style={styles.modalLabel}>Status</Text>
          <View style={styles.pickerRow}>
            {columns.map(col => (
              <TouchableOpacity
                key={col.id}
                style={[styles.pickerOption, newTask.column === col.id && styles.pickerOptionSelected]}
                onPress={() => setNewTask({ ...newTask, column: col.id })}
              >
                <Text style={{ color: newTask.column === col.id ? '#fff' : '#222' }}>{col.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {/* Create/Cancel Buttons */}
          <View style={{ flexDirection: 'row', marginTop: 18, gap: 12 }}>
            <TouchableOpacity style={[styles.createButton, { backgroundColor: '#E5E7EB' }]} onPress={() => setShowNewTask(false)}>
              <Text style={[styles.createButtonText, { color: '#222' }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => {
                if (!newTask.leaseName || !newTask.area || !newTask.documentName || !newTask.conditionType || !newTask.shortenedConditionText || !newTask.assignedTo) return;
                setTasks([
                  {
                    id: `new-${Date.now()}`,
                    leaseName: newTask.leaseName,
                    area: newTask.area,
                    documentName: newTask.documentName,
                    conditionType: newTask.conditionType,
                    conditionText: newTask.shortenedConditionText,
                    column: newTask.column,
                    assignedTo: newTask.assignedTo,
                    priority: newTask.priority,
                    deadline: newTask.deadline || new Date().toISOString().split('T')[0],
                    evidence: [],
                    comments: [],
                  },
                  ...tasks,
                ]);
                setShowNewTask(false);
                setNewTask({
                  leaseName: '', area: '', documentName: '', conditionType: '', shortenedConditionText: '', conditionText: '', priority: 2, assignedTo: '', deadline: '', column: 'assigned',
                });
              }}
            >
              <Text style={styles.createButtonText}>Create</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // Filter Modal
  const renderFilterModal = () => (
    <Modal visible={showFilter} transparent animationType="fade" onRequestClose={() => setShowFilter(false)}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { width: '100%', maxWidth: 340 }]}> 
          <TouchableOpacity style={styles.modalClose} onPress={() => setShowFilter(false)}>
            <Text style={{ color: '#fff', fontSize: 22 }}>×</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Filter Tasks</Text>
          <TextInput
            style={styles.input}
            placeholder="Search by text, lease, area, etc."
            value={searchTerm}
            onChangeText={setSearchTerm}
            autoFocus
          />
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Top bar with Filter and Create Task button */}
      <View style={styles.topBar}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={styles.kanbanTitle}>Kanban Board</Text>
          <TouchableOpacity style={styles.topFilterButton} onPress={() => setShowFilter(true)}>
            <FilterIcon size={22} color="#3B82F6" />
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.topCreateButton} onPress={() => setShowNewTask(true)}>
          <Plus size={22} color="#fff" />
          <Text style={styles.topCreateButtonText}>Create Task</Text>
        </TouchableOpacity>
      </View>
      {renderFilterModal()}
      <ScrollView contentContainerStyle={styles.content}>
        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}><AlertCircle size={22} color="#EF4444" /><Text style={styles.statNum}>{overdueCount}</Text><Text style={styles.statLabel}>Overdue</Text></View>
          <View style={styles.statCard}><Clock size={22} color="#F59E0B" /><Text style={styles.statNum}>{dueThisWeek}</Text><Text style={styles.statLabel}>Due This Week</Text></View>
          <View style={styles.statCard}><FileText size={22} color="#8B5CF6" /><Text style={styles.statNum}>{evidencePending}</Text><Text style={styles.statLabel}>Evidence Pending</Text></View>
          <View style={styles.statCard}><CheckCircle size={22} color="#10B981" /><Text style={styles.statNum}>{completionRate}%</Text><Text style={styles.statLabel}>Complete</Text></View>
        </View>
        {/* Kanban Columns */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.kanbanScroll}>
          <View style={styles.kanbanRow}>
            {columns.map(col => (
              <View key={col.id} style={[styles.column, { borderColor: col.color }]}> 
                <View style={[styles.columnHeader, { backgroundColor: col.color }]}> 
                  <Text style={styles.columnTitle}>{col.title}</Text>
                  <Text style={styles.columnCount}>{filteredTasks.filter(t => t.column === col.id).length} tasks</Text>
                </View>
                <ScrollView style={styles.columnScroll} contentContainerStyle={{ paddingBottom: 20 }}>
                  {filteredTasks.filter(t => t.column === col.id).map(task => (
                    <TouchableOpacity key={task.id} style={styles.taskCard} onPress={() => setSelectedTask(task)}>
                      <Text style={styles.taskTitle}>{task.conditionText}</Text>
                      <View style={styles.taskMetaRow}>
                        <User size={14} color="#6B7280" />
                        <Text style={styles.taskMeta}>{task.assignedTo}</Text>
                        <MapPin size={14} color="#6B7280" style={{ marginLeft: 8 }} />
                        <Text style={styles.taskMeta}>{task.leaseName}</Text>
                      </View>
                      <View style={styles.taskMetaRow}>
                        <Clock size={14} color="#6B7280" />
                        <Text style={styles.taskMeta}>{task.deadline}</Text>
                        <Text style={[styles.taskPriority, { backgroundColor: ['#F87171','#FBBF24','#34D399'][task.priority-1] }]}>{['High','Medium','Low'][task.priority-1]}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            ))}
          </View>
        </ScrollView>
        {renderTaskModal()}
        {renderNewTaskModal()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  content: { padding: 10, paddingBottom: 40 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 18, gap: 8 },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 10, alignItems: 'center', padding: 10, elevation: 2 },
  statNum: { fontSize: 18, fontWeight: '700', color: '#111827', marginTop: 2 },
  statLabel: { fontSize: 12, color: '#6B7280' },
  kanbanScroll: { flexGrow: 0 },
  kanbanRow: { flexDirection: 'row', gap: 12 },
  column: { width: 260, backgroundColor: '#F3F4F6', borderRadius: 14, marginRight: 12, borderWidth: 2, overflow: 'hidden' },
  columnHeader: { padding: 12, alignItems: 'center', borderTopLeftRadius: 12, borderTopRightRadius: 12 },
  columnTitle: { color: '#fff', fontWeight: '700', fontSize: 16 },
  columnCount: { color: '#fff', fontSize: 12, marginTop: 2 },
  columnScroll: { maxHeight: 480 },
  taskCard: { backgroundColor: '#fff', borderRadius: 10, padding: 12, margin: 8, elevation: 2 },
  taskTitle: { fontWeight: '700', color: '#1E293B', fontSize: 14, marginBottom: 6 },
  taskMetaRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  taskMeta: { color: '#6B7280', fontSize: 12, marginLeft: 3 },
  taskPriority: { color: '#fff', fontWeight: '700', fontSize: 11, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2, marginLeft: 10 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalContent: { backgroundColor: '#fff', borderRadius: 18, padding: 18, width: '100%', maxWidth: 340, alignItems: 'flex-start', elevation: 8 },
  modalClose: { position: 'absolute', top: 10, right: 16, zIndex: 10 },
  modalTitle: { fontWeight: '700', fontSize: 16, color: '#3B82F6', marginBottom: 10, marginTop: 10 },
  modalLabel: { color: '#6B7280', fontSize: 13, marginTop: 2 },
  modalValue: { color: '#111827', fontWeight: '600' },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 36,
    backgroundColor: '#3B82F6',
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    zIndex: 100,
  },
  input: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 10,
    fontSize: 15,
    color: '#222',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 4,
    width: '100%',
  },
  columnSelect: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
  },
  createButton: {
    backgroundColor: '#10B981',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
    width: '100%',
  },
  createButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  pickerRow: {
    flexDirection: 'row',
    marginBottom: 10,
    flexWrap: 'wrap',
    gap: 6,
  },
  pickerOption: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginRight: 8,
    marginBottom: 4,
  },
  pickerOptionSelected: {
    backgroundColor: '#3B82F6',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 2,
    backgroundColor: '#F9FAFB',
    zIndex: 10,
  },
  kanbanTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
  },
  topCreateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    elevation: 2,
  },
  topCreateButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
    marginLeft: 6,
  },
  topFilterButton: {
    marginLeft: 16,
    marginRight: 2,
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#E0E7EF',
  },
}); 