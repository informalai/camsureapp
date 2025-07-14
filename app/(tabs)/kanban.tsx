import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Kanban as KanbanIcon,
  Plus,
  Filter,
  Search,
  Calendar,
  User,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react-native';

export default function KanbanScreen() {
  const columns = [
    { id: 'assigned', title: 'Assigned', color: '#3B82F6', count: 0 },
    { id: 'in-progress', title: 'In Progress', color: '#F59E0B', count: 0 },
    { id: 'evidence-submitted', title: 'Evidence Submitted', color: '#8B5CF6', count: 0 },
    { id: 'completed', title: 'Completed', color: '#10B981', count: 0 },
    { id: 'rejected', title: 'Rejected/Reopened', color: '#EF4444', count: 0 },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <KanbanIcon size={32} color="#3B82F6" />
          </View>
          <Text style={styles.title}>Task Board</Text>
          <Text style={styles.subtitle}>
            Compliance workflow management
          </Text>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <CheckCircle size={24} color="#10B981" />
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <View style={styles.statCard}>
            <Clock size={24} color="#F59E0B" />
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>In Progress</Text>
          </View>
          <View style={styles.statCard}>
            <AlertCircle size={24} color="#EF4444" />
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Overdue</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          <TouchableOpacity style={styles.primaryButton}>
            <Plus size={20} color="#FFFFFF" />
            <Text style={styles.primaryButtonText}>Create Task</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.secondaryButton}>
            <Filter size={20} color="#6B7280" />
            <Text style={styles.secondaryButtonText}>Filter</Text>
          </TouchableOpacity>
        </View>

        {/* Kanban Columns Preview */}
        <View style={styles.columnsContainer}>
          <Text style={styles.columnsTitle}>Workflow Columns:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.columnsRow}>
              {columns.map((column, index) => (
                <View key={column.id} style={styles.columnCard}>
                  <View style={[styles.columnHeader, { backgroundColor: column.color }]}>
                    <Text style={styles.columnTitle}>{column.title}</Text>
                  </View>
                  <View style={styles.columnContent}>
                    <Text style={styles.columnCount}>{column.count}</Text>
                    <Text style={styles.columnLabel}>tasks</Text>
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Feature Preview */}
        <View style={styles.featureContainer}>
          <Text style={styles.featureTitle}>Coming Soon Features:</Text>
          
          <View style={styles.featureItem}>
            <KanbanIcon size={20} color="#6B7280" />
            <Text style={styles.featureText}>
              Drag & drop task management
            </Text>
          </View>
          
          <View style={styles.featureItem}>
            <Plus size={20} color="#6B7280" />
            <Text style={styles.featureText}>
              Create compliance tasks with cascading dropdowns
            </Text>
          </View>
          
          <View style={styles.featureItem}>
            <Filter size={20} color="#6B7280" />
            <Text style={styles.featureText}>
              Smart filtering by status, assignee, priority
            </Text>
          </View>
          
          <View style={styles.featureItem}>
            <Calendar size={20} color="#6B7280" />
            <Text style={styles.featureText}>
              Timeline tracking with automated milestones
            </Text>
          </View>
          
          <View style={styles.featureItem}>
            <User size={20} color="#6B7280" />
            <Text style={styles.featureText}>
              Team collaboration with comments & evidence
            </Text>
          </View>
        </View>

        {/* Placeholder Message */}
        <View style={styles.placeholderContainer}>
          <KanbanIcon size={64} color="#D1D5DB" />
          <Text style={styles.placeholderTitle}>No Tasks Yet</Text>
          <Text style={styles.placeholderText}>
            Tasks will sync from the web application or you can create new compliance tasks here.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  headerIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  actionContainer: {
    flexDirection: 'row',
    marginBottom: 30,
    gap: 12,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#3B82F6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  secondaryButtonText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  columnsContainer: {
    marginBottom: 30,
  },
  columnsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  columnsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  columnCard: {
    width: 140,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  columnHeader: {
    padding: 12,
    alignItems: 'center',
  },
  columnTitle: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  columnContent: {
    padding: 16,
    alignItems: 'center',
  },
  columnCount: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  columnLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  featureContainer: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 12,
    flex: 1,
  },
  placeholderContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  placeholderTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#9CA3AF',
    marginTop: 16,
    marginBottom: 8,
  },
  placeholderText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
}); 