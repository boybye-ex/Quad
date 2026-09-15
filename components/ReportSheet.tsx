import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { createReport, REPORT_REASONS, ReportReason } from '@/lib/admin';
import { colors, fontSize, fontWeight, spacing, borderRadius } from '@/constants/theme';

interface ReportSheetProps {
  visible: boolean;
  onClose: () => void;
  targetType: 'listing' | 'user' | 'message';
  targetId: string;
  targetName: string;
}

export function ReportSheet({
  visible,
  onClose,
  targetType,
  targetId,
  targetName,
}: ReportSheetProps) {
  const [selectedReason, setSelectedReason] = useState<ReportReason | null>(null);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selectedReason) {
      Alert.alert('Error', 'Please select a reason for your report');
      return;
    }

    setIsSubmitting(true);
    const result = await createReport(targetType, targetId, selectedReason, description || undefined);
    setIsSubmitting(false);

    if (result.error) {
      Alert.alert('Error', result.error);
      return;
    }

    Alert.alert('Report Submitted', 'Thank you for your report. Our team will review it shortly.', [
      {
        text: 'OK',
        onPress: () => {
          setSelectedReason(null);
          setDescription('');
          onClose();
        },
      },
    ]);
  };

  const handleClose = () => {
    setSelectedReason(null);
    setDescription('');
    onClose();
  };

  const getTargetLabel = () => {
    switch (targetType) {
      case 'listing':
        return 'listing';
      case 'user':
        return 'user';
      case 'message':
        return 'message';
      default:
        return 'item';
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Report {getTargetLabel()}</Text>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={colors.text.dark} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.targetInfo}>
            <Ionicons
              name={targetType === 'listing' ? 'cube' : targetType === 'user' ? 'person' : 'chatbubble'}
              size={20}
              color={colors.primary.DEFAULT}
            />
            <Text style={styles.targetName} numberOfLines={1}>
              {targetName}
            </Text>
          </View>

          <Text style={styles.sectionTitle}>Why are you reporting this?</Text>

          <View style={styles.reasonsContainer}>
            {REPORT_REASONS.map((reason) => (
              <TouchableOpacity
                key={reason.value}
                style={[
                  styles.reasonOption,
                  selectedReason === reason.value && styles.reasonOptionSelected,
                ]}
                onPress={() => setSelectedReason(reason.value)}
              >
                <View style={styles.reasonContent}>
                  <View
                    style={[
                      styles.radioOuter,
                      selectedReason === reason.value && styles.radioOuterSelected,
                    ]}
                  >
                    {selectedReason === reason.value && <View style={styles.radioInner} />}
                  </View>
                  <Text
                    style={[
                      styles.reasonText,
                      selectedReason === reason.value && styles.reasonTextSelected,
                    ]}
                  >
                    {reason.label}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.sectionTitle}>Additional details (optional)</Text>
          <TextInput
            style={styles.descriptionInput}
            value={description}
            onChangeText={setDescription}
            placeholder="Provide more context about your report..."
            placeholderTextColor={colors.text.light}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            maxLength={500}
          />
          <Text style={styles.charCount}>{description.length}/500</Text>

          <View style={styles.disclaimer}>
            <Ionicons name="information-circle-outline" size={20} color={colors.text.gray} />
            <Text style={styles.disclaimerText}>
              Your report is confidential. We take all reports seriously and will review this within 24-48 hours.
            </Text>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.submitButton, !selectedReason && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={!selectedReason || isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color={colors.text.white} />
            ) : (
              <Text style={styles.submitButtonText}>Submit Report</Text>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text.dark,
  },
  closeButton: {
    padding: spacing.xs,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  targetInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.DEFAULT,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  targetName: {
    flex: 1,
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    color: colors.text.dark,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text.dark,
    marginBottom: spacing.md,
  },
  reasonsContainer: {
    marginBottom: spacing.xl,
  },
  reasonOption: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  reasonOptionSelected: {
    backgroundColor: colors.secondary.light + '15',
    marginHorizontal: -spacing.lg,
    paddingHorizontal: spacing.lg,
    borderBottomColor: 'transparent',
  },
  reasonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {
    borderColor: colors.primary.DEFAULT,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary.DEFAULT,
  },
  reasonText: {
    fontSize: fontSize.base,
    color: colors.text.dark,
  },
  reasonTextSelected: {
    fontWeight: fontWeight.medium,
    color: colors.primary.DEFAULT,
  },
  descriptionInput: {
    backgroundColor: colors.background.DEFAULT,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    fontSize: fontSize.base,
    color: colors.text.dark,
    minHeight: 100,
    marginBottom: spacing.xs,
  },
  charCount: {
    fontSize: fontSize.xs,
    color: colors.text.light,
    textAlign: 'right',
    marginBottom: spacing.lg,
  },
  disclaimer: {
    flexDirection: 'row',
    backgroundColor: colors.background.DEFAULT,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  disclaimerText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.text.gray,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    gap: spacing.md,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    backgroundColor: colors.background.DEFAULT,
  },
  cancelButtonText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.text.gray,
  },
  submitButton: {
    flex: 2,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    backgroundColor: colors.accent.red,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.text.white,
  },
});
