export interface TimelineEvent {
  id: string;
  title: string;
  company?: string;
  status: "Completed" | "Current" | "Upcoming" | "Rejected" | "Skipped";
  date: string;
  description: string;
}

export interface OfferDetails {
  status: "Offered" | "Accepted" | "Verified" | "Joining Soon" | "Joined";
  type: "Full Time" | "Internship" | "PPO";
  ctc: string;
  offerDate: string;
  joiningDate: string;
  dbJoiningDate?: string;
  description: string;
  actionsRequired: string[];
  companyId?: string;
}

export interface ApplicationProgress {
  id: string;
  company: string;
  role: string;
  overallStatus: string;
  currentStage: string;
  completion: number;
  location: string;
  ctc: string;
  events: TimelineEvent[];
  offer?: OfferDetails;
  driveId?: string;
}

export interface DateModalData {
  appId: string;
  companyId: string;
  driveId: string;
  roleTitle: string;
  packageCtc: string;
  currentDate?: string;
}
