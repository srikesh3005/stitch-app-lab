import { useAuthState } from 'react-firebase-hooks/auth';
import { useCollection, useDocument } from 'react-firebase-hooks/firestore';
import { auth, db } from './firebase';
import { collection, doc, DocumentReference, CollectionReference } from 'firebase/firestore';

// Auth hooks
export const useAuth = () => {
  const [user, loading, error] = useAuthState(auth);
  return { user, loading, error };
};

// Firestore hooks
export const useFirestoreCollection = (path: string) => {
  const [value, loading, error] = useCollection(collection(db, path));
  return { data: value, loading, error };
};

export const useFirestoreDocument = (path: string) => {
  const [value, loading, error] = useDocument(doc(db, path));
  return { data: value, loading, error };
};

// Helper functions for common Firebase operations
export const getCollectionRef = (path: string): CollectionReference => {
  return collection(db, path);
};

export const getDocumentRef = (path: string): DocumentReference => {
  return doc(db, path);
};