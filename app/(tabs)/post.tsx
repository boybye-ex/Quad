import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Chip } from '@/components/ui/Chip';
import { useAuthStore } from '@/store/authStore';
import { fetchCategories, uploadListingImage, createListing, CreateListingInput } from '@/lib/listings';
import { colors, fontSize, fontWeight, spacing, borderRadius, shadows } from '@/constants/theme';
import { PriceType, Category } from '@/types';

type Step = 'category' | 'details' | 'preview';

const priceTypes: { value: PriceType; label: string }[] = [
  { value: 'fixed', label: 'Fixed Price' },
  { value: 'hourly', label: 'Per Hour' },
  { value: 'monthly', label: 'Per Month' },
  { value: 'free', label: 'Free' },
];

const conditions = [
  { value: 'new', label: 'New' },
  { value: 'like-new', label: 'Like New' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
];

export default function PostScreen() {
  const router = useRouter();
  const { isAuthenticated, user, selectedCampus } = useAuthStore();

  const [step, setStep] = useState<Step>('category');
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [priceType, setPriceType] = useState<PriceType>('fixed');
  const [condition, setCondition] = useState<string>('good');
  const [tags, setTags] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    fetchCategories().then(setCategories);
  }, []);

  const handlePickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert(
        'Permission Required',
        'Please allow access to your photo library to upload images.'
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: 5 - images.length,
      quality: 0.8,
      aspect: [4, 3],
    });

    if (!result.canceled) {
      const newImages = result.assets.map((asset) => asset.uri);
      setImages([...images, ...newImages].slice(0, 5));
    }
  };

  const handleTakePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert('Permission Required', 'Please allow camera access to take photos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
      aspect: [4, 3],
    });

    if (!result.canceled) {
      setImages([...images, result.assets[0].uri].slice(0, 5));
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleCategorySelect = (categorySlug: string, categoryId: string) => {
    setSelectedCategory(categorySlug);
    setSelectedCategoryId(categoryId);
  };

  const handleSubmit = async () => {
    if (!isAuthenticated || !user) {
      Alert.alert('Sign In Required', 'Please sign in to post a listing.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign In', onPress: () => router.push('/(auth)/sign-in') },
      ]);
      return;
    }

    if (!selectedCampus) {
      Alert.alert('Campus Required', 'Please select a campus in your profile settings.');
      return;
    }

    if (!selectedCategoryId) {
      Alert.alert('Category Required', 'Please select a category for your listing.');
      return;
    }

    setIsSubmitting(true);
    setUploadProgress(0);

    try {
      const uploadedUrls: string[] = [];
      for (let i = 0; i < images.length; i++) {
        setUploadProgress(Math.round(((i + 1) / images.length) * 50));
        const result = await uploadListingImage(user.id, images[i]);
        if (result.url) {
          uploadedUrls.push(result.url);
        } else {
          console.error('Failed to upload image:', result.error);
        }
      }

      setUploadProgress(75);

      const listingInput: CreateListingInput = {
        title,
        description,
        price: priceType === 'free' ? 0 : parseFloat(price) || 0,
        priceType,
        categoryId: selectedCategoryId,
        images: uploadedUrls.length > 0 ? uploadedUrls : images,
        campusId: selectedCampus.id,
        condition: ['textbooks', 'electronics', 'furniture'].includes(selectedCategory || '')
          ? (condition as 'new' | 'like-new' | 'good' | 'fair')
          : undefined,
        tags: tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
      };

      const result = await createListing(listingInput, user.id);

      setUploadProgress(100);

      if (result.error) {
        Alert.alert('Error', result.error);
        setIsSubmitting(false);
        return;
      }

      Alert.alert('Success!', 'Your listing has been posted.', [
        {
          text: 'View Listing',
          onPress: () => {
            resetForm();
            if (result.listing) {
              router.push(`/listing/${result.listing.id}`);
            } else {
              router.push('/(tabs)');
            }
          },
        },
      ]);
    } catch (error) {
      console.error('Error creating listing:', error);
      Alert.alert('Error', 'Failed to create listing. Please try again.');
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  };

  const resetForm = () => {
    setStep('category');
    setSelectedCategory(null);
    setSelectedCategoryId(null);
    setImages([]);
    setTitle('');
    setDescription('');
    setPrice('');
    setPriceType('fixed');
    setCondition('good');
    setTags('');
  };

  const canProceedToDetails = selectedCategory !== null;
  const canProceedToPreview =
    title.trim() && description.trim() && (priceType === 'free' || price.trim());

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.authPrompt}>
          <View style={styles.authIconContainer}>
            <Ionicons name="add-circle" size={64} color={colors.primary.DEFAULT} />
          </View>
          <Text style={styles.authTitle}>Post a Listing</Text>
          <Text style={styles.authDescription}>
            Sign in to share textbooks, housing, tutoring, and more with your campus community.
          </Text>
          <Button
            title="Sign In to Post"
            onPress={() => router.push('/(auth)/welcome')}
            fullWidth
          />
        </View>
      </SafeAreaView>
    );
  }

  const renderCategoryStep = () => (
    <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.stepTitle}>What are you posting?</Text>
      <Text style={styles.stepSubtitle}>Select a category for your listing</Text>

      <View style={styles.categoriesGrid}>
        {categories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryCard,
              selectedCategory === category.slug && styles.categoryCardSelected,
            ]}
            onPress={() => handleCategorySelect(category.slug, category.id)}
          >
            <View
              style={[
                styles.categoryIconContainer,
                selectedCategory === category.slug && styles.categoryIconContainerSelected,
              ]}
            >
              <Ionicons
                name={getCategoryIcon(category.slug)}
                size={28}
                color={
                  selectedCategory === category.slug ? colors.text.white : colors.primary.DEFAULT
                }
              />
            </View>
            <Text
              style={[
                styles.categoryCardText,
                selectedCategory === category.slug && styles.categoryCardTextSelected,
              ]}
            >
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );

  const renderDetailsStep = () => (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.keyboardView}
    >
      <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.stepTitle}>Listing Details</Text>

        {/* Images */}
        <View style={styles.imagesSection}>
          <Text style={styles.inputLabel}>Photos ({images.length}/5)</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.imagesRow}>
              {images.map((uri, index) => (
                <View key={index} style={styles.imageContainer}>
                  <Image source={{ uri }} style={styles.imagePreview} contentFit="cover" />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => handleRemoveImage(index)}
                  >
                    <Ionicons name="close" size={16} color={colors.text.white} />
                  </TouchableOpacity>
                </View>
              ))}
              {images.length < 5 && (
                <View style={styles.addImageButtons}>
                  <TouchableOpacity style={styles.addImageButton} onPress={handlePickImage}>
                    <Ionicons name="images-outline" size={24} color={colors.text.gray} />
                    <Text style={styles.addImageText}>Gallery</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.addImageButton} onPress={handleTakePhoto}>
                    <Ionicons name="camera-outline" size={24} color={colors.text.gray} />
                    <Text style={styles.addImageText}>Camera</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </ScrollView>
        </View>

        {/* Title */}
        <Input
          label="Title"
          value={title}
          onChangeText={setTitle}
          placeholder="What are you selling or offering?"
          containerStyle={styles.inputContainer}
        />

        {/* Description */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Description</Text>
          <TextInput
            style={styles.textArea}
            value={description}
            onChangeText={setDescription}
            placeholder="Describe your listing in detail..."
            placeholderTextColor={colors.text.light}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Price Type */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Pricing</Text>
          <View style={styles.priceTypeRow}>
            {priceTypes.map((type) => (
              <Chip
                key={type.value}
                label={type.label}
                selected={priceType === type.value}
                onPress={() => setPriceType(type.value)}
                size="sm"
              />
            ))}
          </View>
        </View>

        {/* Price Input */}
        {priceType !== 'free' && (
          <Input
            label="Price (ZAR)"
            value={price}
            onChangeText={setPrice}
            placeholder="0"
            keyboardType="decimal-pad"
            leftIcon={<Text style={styles.currencySymbol}>R</Text>}
            containerStyle={styles.inputContainer}
          />
        )}

        {/* Condition (for items) */}
        {selectedCategory && ['textbooks', 'electronics', 'furniture'].includes(selectedCategory) && (
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Condition</Text>
            <View style={styles.conditionRow}>
              {conditions.map((c) => (
                <Chip
                  key={c.value}
                  label={c.label}
                  selected={condition === c.value}
                  onPress={() => setCondition(c.value)}
                  size="sm"
                />
              ))}
            </View>
          </View>
        )}

        {/* Tags */}
        <Input
          label="Tags (optional)"
          value={tags}
          onChangeText={setTags}
          placeholder="e.g., CHEM 33, Fall Semester"
          hint="Separate with commas"
          containerStyle={styles.inputContainer}
        />

        <View style={styles.bottomPadding} />
      </ScrollView>
    </KeyboardAvoidingView>
  );

  const renderPreviewStep = () => {
    const category = categories.find((c) => c.slug === selectedCategory);
    const formattedPrice =
      priceType === 'free'
        ? 'Free'
        : `R${price}${priceType === 'hourly' ? '/hour' : priceType === 'monthly' ? '/month' : ''}`;

    return (
      <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.stepTitle}>Preview Your Listing</Text>

        <View style={styles.previewCard}>
          {images.length > 0 ? (
            <Image source={{ uri: images[0] }} style={styles.previewImage} contentFit="cover" />
          ) : (
            <View style={[styles.previewImage, styles.previewImagePlaceholder]}>
              <Ionicons name="image-outline" size={48} color={colors.text.gray} />
            </View>
          )}

          <View style={styles.previewContent}>
            <View style={styles.previewPriceRow}>
              <Text style={styles.previewPrice}>{formattedPrice}</Text>
              {category && (
                <View style={styles.previewCategory}>
                  <Text style={styles.previewCategoryText}>{category.name}</Text>
                </View>
              )}
            </View>

            <Text style={styles.previewTitle}>{title || 'Your title here'}</Text>
            <Text style={styles.previewDescription}>{description || 'Your description here'}</Text>

            {tags && (
              <View style={styles.previewTags}>
                {tags.split(',').map((tag, index) => (
                  <View key={index} style={styles.previewTag}>
                    <Text style={styles.previewTagText}>{tag.trim()}</Text>
                  </View>
                ))}
              </View>
            )}

            <View style={styles.previewSeller}>
              <View style={styles.previewSellerAvatar}>
                <Text style={styles.previewSellerInitials}>{user?.name?.charAt(0) || 'U'}</Text>
              </View>
              <View>
                <Text style={styles.previewSellerName}>{user?.name || 'You'}</Text>
                <Text style={styles.previewSellerRole}>
                  {user?.role || 'Student'} • {selectedCampus?.shortName}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.previewNote}>
          <Ionicons name="information-circle-outline" size={20} color={colors.text.gray} />
          <Text style={styles.previewNoteText}>
            Your listing will be visible to all students at SA campuses.
          </Text>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        {step !== 'category' && (
          <TouchableOpacity
            onPress={() => setStep(step === 'preview' ? 'details' : 'category')}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text.dark} />
          </TouchableOpacity>
        )}
        <Text style={styles.headerTitle}>
          {step === 'category' ? 'New Listing' : step === 'details' ? 'Details' : 'Preview'}
        </Text>
        <View style={styles.headerRight} />
      </View>

      {/* Progress */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width: step === 'category' ? '33%' : step === 'details' ? '66%' : '100%',
              },
            ]}
          />
        </View>
        <View style={styles.progressSteps}>
          <Text style={[styles.progressStep, step === 'category' && styles.progressStepActive]}>
            1. Category
          </Text>
          <Text style={[styles.progressStep, step === 'details' && styles.progressStepActive]}>
            2. Details
          </Text>
          <Text style={[styles.progressStep, step === 'preview' && styles.progressStepActive]}>
            3. Preview
          </Text>
        </View>
      </View>

      {/* Step Content */}
      {step === 'category' && renderCategoryStep()}
      {step === 'details' && renderDetailsStep()}
      {step === 'preview' && renderPreviewStep()}

      {/* Footer */}
      <View style={styles.footer}>
        {step === 'category' && (
          <Button
            title="Continue"
            onPress={() => setStep('details')}
            disabled={!canProceedToDetails}
            fullWidth
            icon={<Ionicons name="arrow-forward" size={18} color={colors.text.white} />}
          />
        )}
        {step === 'details' && (
          <Button
            title="Preview Listing"
            onPress={() => setStep('preview')}
            disabled={!canProceedToPreview}
            fullWidth
            icon={<Ionicons name="eye-outline" size={18} color={colors.text.white} />}
          />
        )}
        {step === 'preview' && (
          <View>
            {isSubmitting && uploadProgress > 0 && (
              <View style={styles.uploadProgressContainer}>
                <View style={[styles.uploadProgressBar, { width: `${uploadProgress}%` }]} />
                <Text style={styles.uploadProgressText}>
                  {uploadProgress < 50 ? 'Uploading images...' : 'Creating listing...'}
                </Text>
              </View>
            )}
            <Button
              title={isSubmitting ? 'Posting...' : 'Post Listing'}
              onPress={handleSubmit}
              loading={isSubmitting}
              fullWidth
              icon={
                !isSubmitting ? (
                  <Ionicons name="checkmark" size={18} color={colors.text.white} />
                ) : undefined
              }
            />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

function getCategoryIcon(slug: string): keyof typeof Ionicons.glyphMap {
  const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
    textbooks: 'book-outline',
    housing: 'home-outline',
    tutoring: 'school-outline',
    rides: 'car-outline',
    shifts: 'briefcase-outline',
    electronics: 'laptop-outline',
    furniture: 'bed-outline',
  };
  return icons[slug] || 'grid-outline';
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.DEFAULT,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -spacing.sm,
  },
  headerTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text.dark,
  },
  headerRight: {
    width: 40,
  },
  progressContainer: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  progressBar: {
    height: 4,
    backgroundColor: colors.border.light,
    borderRadius: 2,
    marginBottom: spacing.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary.DEFAULT,
    borderRadius: 2,
  },
  progressSteps: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressStep: {
    fontSize: fontSize.xs,
    color: colors.text.gray,
  },
  progressStepActive: {
    color: colors.primary.DEFAULT,
    fontWeight: fontWeight.medium,
  },
  stepContent: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  keyboardView: {
    flex: 1,
  },
  stepTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text.dark,
    marginBottom: spacing.xs,
  },
  stepSubtitle: {
    fontSize: fontSize.base,
    color: colors.text.gray,
    marginBottom: spacing.xl,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  categoryCard: {
    width: '47%',
    backgroundColor: colors.background.white,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    alignItems: 'center',
    ...shadows.sm,
  },
  categoryCardSelected: {
    backgroundColor: colors.primary.DEFAULT,
  },
  categoryIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.secondary.light + '30',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  categoryIconContainerSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  categoryCardText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    color: colors.text.dark,
    textAlign: 'center',
  },
  categoryCardTextSelected: {
    color: colors.text.white,
  },
  imagesSection: {
    marginBottom: spacing.lg,
  },
  inputLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text.dark,
    marginBottom: spacing.sm,
  },
  imagesRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  imageContainer: {
    position: 'relative',
  },
  imagePreview: {
    width: 100,
    height: 100,
    borderRadius: borderRadius.lg,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.accent.red,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addImageButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  addImageButton: {
    width: 100,
    height: 100,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.border.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  addImageText: {
    fontSize: fontSize.xs,
    color: colors.text.gray,
  },
  inputContainer: {
    marginBottom: spacing.lg,
  },
  textArea: {
    backgroundColor: colors.background.white,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    padding: spacing.lg,
    minHeight: 100,
    fontSize: fontSize.base,
    color: colors.text.dark,
  },
  priceTypeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  conditionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  currencySymbol: {
    fontSize: fontSize.md,
    color: colors.text.gray,
  },
  bottomPadding: {
    height: spacing['4xl'],
  },
  footer: {
    padding: spacing.lg,
    backgroundColor: colors.background.white,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  uploadProgressContainer: {
    height: 24,
    backgroundColor: colors.border.light,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.md,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  uploadProgressBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: colors.secondary.DEFAULT,
  },
  uploadProgressText: {
    textAlign: 'center',
    fontSize: fontSize.sm,
    color: colors.text.dark,
    fontWeight: fontWeight.medium,
  },
  authPrompt: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  authIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.secondary.light + '30',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  authTitle: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.text.dark,
    marginBottom: spacing.md,
  },
  authDescription: {
    fontSize: fontSize.base,
    color: colors.text.gray,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 24,
  },
  previewCard: {
    backgroundColor: colors.background.white,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.md,
  },
  previewImage: {
    width: '100%',
    height: 200,
  },
  previewImagePlaceholder: {
    backgroundColor: colors.background.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewContent: {
    padding: spacing.lg,
  },
  previewPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  previewPrice: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text.dark,
  },
  previewCategory: {
    backgroundColor: colors.background.DEFAULT,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  previewCategoryText: {
    fontSize: fontSize.sm,
    color: colors.text.gray,
  },
  previewTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text.dark,
    marginBottom: spacing.sm,
  },
  previewDescription: {
    fontSize: fontSize.base,
    color: colors.text.gray,
    lineHeight: 22,
    marginBottom: spacing.md,
  },
  previewTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  previewTag: {
    backgroundColor: colors.secondary.light + '30',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  previewTagText: {
    fontSize: fontSize.sm,
    color: colors.primary.DEFAULT,
  },
  previewSeller: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  previewSellerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  previewSellerInitials: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text.white,
  },
  previewSellerName: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    color: colors.text.dark,
  },
  previewSellerRole: {
    fontSize: fontSize.sm,
    color: colors.text.gray,
  },
  previewNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.background.white,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  previewNoteText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.text.gray,
    lineHeight: 20,
  },
});
