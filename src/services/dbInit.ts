import {
  collection,
  doc,
  getDocs,
  setDoc,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { InsurancePolicy } from '../types';

export const OFFICIAL_POLICIES: Omit<InsurancePolicy, 'id'>[] = [
  {
    policyName: 'Pradhan Mantri Jeevan Jyoti Bima Yojana (PMJJBY)',
    provider: 'Life Insurance Corporation of India (LIC) & Ministry of Finance',
    coverage: '₹2,00,000 Life Risk Protection',
    premiumInfo: '₹436 per annum (Direct Debit from Bank A/C)',
    eligibility: 'Farmers and Land Owners aged 18 to 50 years with a verified savings bank account.',
    keyBenefits: [
      'Pure term life cover of ₹2 Lakh in case of death due to any reason',
      'Affordable micro-premium backed by government co-sponsorship',
      'Simple paperless enrollment directly linked via Jan Dhan / savings bank account',
      'Renewable annually with guaranteed continuation'
    ],
    providerType: 'Government Scheme',
    applicationUrl: 'https://jansuraksha.gov.in',
    statusBadge: 'Govt. Backed & Subsidized'
  },
  {
    policyName: 'Kisan Suraksha Krishi Term Life Cover',
    provider: 'Agriculture Insurance Company of India (AIC) & Partner Insurers',
    coverage: '₹5,00,000 to ₹10,00,000 Comprehensive Life & Permanent Disability',
    premiumInfo: '₹1,850 - ₹3,600 per year based on age',
    eligibility: 'Active farmers, tenant cultivators, and agricultural landowners aged 18 to 65.',
    keyBenefits: [
      'Financial security protection for agricultural dependents during harvest failure or unforeseen loss',
      'Double accidental death benefit rider included',
      'Grace period aligned with crop harvesting sales cycles',
      'Direct-to-nominee emergency disbursal support'
    ],
    providerType: 'Licensed Insurer',
    applicationUrl: 'https://aicofindia.com',
    statusBadge: 'Partner Insurer Policy'
  },
  {
    policyName: 'Aam Aadmi Bima Yojana (AABY) for Rural Cultivators',
    provider: 'Social Security Fund & LIC Rural Division',
    coverage: '₹75,000 Natural Death / ₹1,50,000 Accidental Death + Child Shiksha Sahayog',
    premiumInfo: '₹200 per annum (50% subsidized by Central/State govt)',
    eligibility: 'Rural landless agricultural laborers and small & marginal farmers aged 18 to 59.',
    keyBenefits: [
      'Natural & accidental death financial safety net',
      'Free add-on scholarship benefit for up to two children studying in 9th to 12th standard',
      'Zero processing fee for verified agricultural labor card holders',
      'Speedy settlement via local Panchayat / District nodal offices'
    ],
    providerType: 'Government Scheme',
    applicationUrl: 'https://licindia.in',
    statusBadge: 'Subsidized Rural Scheme'
  }
];

export async function initializeDefaultPolicies() {
  const policiesPath = 'insurance_policies';
  try {
    const snap = await getDocs(collection(db, policiesPath));
    if (snap.empty) {
      for (const policy of OFFICIAL_POLICIES) {
        await addDoc(collection(db, policiesPath), {
          ...policy,
          createdAt: new Date().toISOString()
        });
      }
    }
  } catch (error) {
    console.warn('Could not initialize policies (may already exist or permission limited):', error);
  }
}

export async function createNotification(
  userId: string,
  title: string,
  message: string,
  type: 'land' | 'work' | 'insurance' | 'loan' | 'seed' | 'system',
  link?: string
) {
  const notifPath = 'notifications';
  try {
    await addDoc(collection(db, notifPath), {
      userId,
      title,
      message,
      type,
      read: false,
      link: link || '',
      createdAt: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, notifPath);
  }
}
