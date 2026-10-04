import { collection, getDocs, doc, deleteDoc, query, where } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { LandListing } from '../types';

// Purge any residual seed or fake records from the Firestore database
export async function purgeFakeDataFromDatabase(): Promise<{ deletedLands: number; deletedUsers: number }> {
  let deletedLands = 0;
  let deletedUsers = 0;

  try {
    // 1. Scan and delete fake farmlands from 'lands' collection
    const landsSnap = await getDocs(collection(db, 'lands'));
    const fakeOwnerIds = new Set(['seed_owner_1', 'seed_owner_2', 'seed_owner_3', 'seed_owner_warangal', 'seed_owner_guntur']);
    const fakeTitles = [
      'Fertile 8-Acre Black Cotton Farmland with 24/7 Borewell',
      '5-Acre Alluvial River-Basin Farmland for Paddy & Organic Farming',
      '12-Acre Red Sandy Loam Plot with Drip Line for Groundnut & Millets'
    ];

    for (const d of landsSnap.docs) {
      const data = d.data() as Partial<LandListing>;
      const isFake =
        d.id.startsWith('default-land-') ||
        d.id.startsWith('seed-') ||
        (data.ownerId && fakeOwnerIds.has(data.ownerId)) ||
        (data.ownerId && data.ownerId.startsWith('seed_owner_')) ||
        (data.ownerEmail && data.ownerEmail.includes('@kethwadi.in')) ||
        (data.title && fakeTitles.includes(data.title));

      if (isFake) {
        try {
          await deleteDoc(doc(db, 'lands', d.id));
          deletedLands++;
        } catch (e) {
          console.warn('Could not delete fake land doc:', d.id, e);
        }
      }
    }

    // 2. Scan and delete fake users if any
    try {
      const usersSnap = await getDocs(collection(db, 'users'));
      for (const d of usersSnap.docs) {
        const data = d.data();
        const isFakeUser =
          d.id.startsWith('demo_') ||
          d.id.startsWith('seed_') ||
          (data.email && typeof data.email === 'string' && data.email.endsWith('@kethwadi.in') && !data.email.startsWith('admin'));
        if (isFakeUser) {
          await deleteDoc(doc(db, 'users', d.id));
          deletedUsers++;
        }
      }
    } catch (e) {
      console.warn('Notice scanning users for fake data cleanup:', e);
    }

    // 3. Scan and delete dummy farming works if any
    try {
      const worksSnap = await getDocs(collection(db, 'farming_works'));
      for (const d of worksSnap.docs) {
        const data = d.data();
        if (
          (data.farmerId && (data.farmerId.startsWith('demo_') || data.farmerId.startsWith('seed_'))) ||
          (data.ownerId && (data.ownerId.startsWith('demo_') || data.ownerId.startsWith('seed_')))
        ) {
          await deleteDoc(doc(db, 'farming_works', d.id));
        }
      }
    } catch (e) {
      // ignore
    }

    return { deletedLands, deletedUsers };
  } catch (err) {
    console.warn('Notice while purging fake data from Firestore:', err);
    return { deletedLands, deletedUsers };
  }
}

// Deprecated empty function: Never seed fake data into the database
export async function seedInitialFarmlandsIfEmpty(): Promise<void> {
  // Purposely do nothing - fake data should never be auto-seeded into the database
}

// Empty export to satisfy any legacy references
export const INITIAL_LANDS: Omit<LandListing, 'id'>[] = [];
