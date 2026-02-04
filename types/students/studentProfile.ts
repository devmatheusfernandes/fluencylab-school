export interface StudentProfile {
  id?: string;
  studentId?: string; // Optional link to User

  // Section 1: Basic Info
  name: string;
  email?: string;
  phoneNumber?: string;
  city?: string;
  state?: string;
  birthDate?: string;
  age?: number;
  profession?: string;

  // Guardian Info (for minors)
  guardianName?: string;
  guardianContact?: string;

  // Section 2: History
  languageOfInterest?: string;
  level?: string;
  placementNotes?: string;
  previousStudy?: boolean;
  previousStudyTime?: string; // "Less than 6 months", "6m-2y", "2y+"
  approximateLevel?: string; // "A1", "A2", "B1", "B2", "C1", "C2", "Unknown"

  // Section 3: Objectives
  mainGoals?: string[]; // "Travel", "Work", etc.
  deadline?: string; // "3 months", "6 months", "1 year", "2 years", "No deadline"
  deadlineDate?: string; // Specific date if applicable
  deadlineReason?: string;
  specificMotivation?: string;
  commitmentLevel?: number; // 1-10

  // Section 4: Availability
  classFrequency?: string; // "1", "2", "3", "4+"
  bestTimes?: string;
  studyTimePerDay?: string; // "None", "5-30m", "30-60m", "1h+"

  // Section 5: Professional
  employmentStatus?: string; // "employed", "student", "unemployed", "retired", "other"
  professionalArea?: string;
  professionalSector?: string;
  professionalUsage?: string[]; // "Meetings", "Emails", etc.
  professionalUsageType?: string; // "Written", "Spoken", "Balanced"
  technicalVocabulary?: string;
  currentProfessionalUsage?: string; // "Never", "Rarely", "Sometimes", "Frequently"

  // Section 6: Interests
  hobbies?: string[]; // List of selected hobbies
  hobbiesDetails?: string; // "Sports: Soccer, Music: Rock"
  contentConsumption?: string; // "Never", "Rarely", "Sometimes", "Frequently"
  contentTypes?: string[]; // "Music", "Movies", etc.
  contentDetails?: string; // "Artists: Beatles, Movies: Action"
  interestTopics?: string;

  // Section 7: Learning Style
  learningMethods?: string[]; // Max 3
  activityPreferences?: {
    reading?: number;
    writing?: number;
    speaking?: number;
    listening?: number;
    videos?: number;
    grammar?: number;
    games?: number;
    presentation?: number;
    apps?: number;
    anki?: number;
    duolingo?: number;
  };

  // Section 8: Difficulties
  difficulties?: string[];
  pastExperiencesGood?: string;
  pastExperiencesBad?: string;
  specialNeeds?: string;
  speakingAnxiety?: string; // "None", "Little", "Much", "Very Much"

  // Section 9: Preferences
  languageVariant?: string;
  accentGoal?: string;
  classExpectations?: string[]; // Max 3
  learningPace?: string; // "Intense", "Moderate", "Relaxed", "Flexible"
  correctionStyle?: string; // "Immediate", "Important", "End", "Gentle"

  // Section 10: Additional
  otherLanguages?: string;
  observations?: string;
  firstImpressions?: string;
  restrictions?: string; // What NOT to do
  questions?: string;

  // Form Specific Structures
  preferences?: {
    schedule: string;
    likes: string;
  };
  goals?: {
    mainGoal: string;
    deadline: string;
  };

  // Metadata
  createdAt: Date | string;
  updatedAt: Date | string;
  
  // AI Generated Content
  generatedPromptPlan?: string;
  promptHistory?: {
    content: string;
    createdAt: string;
  }[];
}
