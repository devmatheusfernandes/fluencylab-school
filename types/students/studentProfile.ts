export interface StudentProfile {
  id?: string;
  userId: string;
  
  // Section 1: Contact (Fields that might also exist in User, but captured here)
  name: string;
  email: string;
  phoneNumber: string;
  city?: string;
  state?: string;
  
  // Section 2: Pedagogical Profile
  languageOfInterest: string;
  
  // Detailed info
  age?: number;
  level?: string;
  placementNotes?: string;
  
  preferences?: {
    schedule?: string;
    likes?: string;
  };
  
  goals?: {
    mainGoal?: string;
    deadline?: string;
  };
  
  firstImpressions?: string;
  
  createdAt: Date;
  updatedAt: Date;
}
