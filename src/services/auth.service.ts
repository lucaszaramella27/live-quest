import { 
  signInWithPopup, 
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  signOut as firebaseSignOut,
  User as FirebaseUser 
} from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { auth, db } from './firebase'
import { User } from '@/shared/types'

const googleProvider = new GoogleAuthProvider()

export async function signInWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider)
  const firebaseUser = result.user
  
  // Buscar ou criar usuário no Firestore
  const userRef = doc(db, 'users', firebaseUser.uid)
  const userDoc = await getDoc(userRef)
  
  if (!userDoc.exists()) {
    // Criar novo usuário
    const newUser: Omit<User, 'id'> = {
      email: firebaseUser.email!,
      displayName: firebaseUser.displayName || firebaseUser.email!.split('@')[0],
      photoURL: firebaseUser.photoURL || undefined,
      isPremium: false,
      createdAt: new Date(),
    }
    await setDoc(userRef, newUser)
    
    return { id: firebaseUser.uid, ...newUser }
  }
  
  return { id: userDoc.id, ...userDoc.data() } as User
}

export async function signUpWithEmail(email: string, password: string, displayName: string): Promise<User> {
  const result = await createUserWithEmailAndPassword(auth, email, password)
  const firebaseUser = result.user
  
  // Atualizar perfil com nome
  await updateProfile(firebaseUser, { displayName })
  
  // Criar usuário no Firestore
  const newUser: Omit<User, 'id'> = {
    email: firebaseUser.email!,
    displayName,
    photoURL: undefined,
    isPremium: false,
    createdAt: new Date(),
  }
  
  const userRef = doc(db, 'users', firebaseUser.uid)
  await setDoc(userRef, newUser)
  
  return { id: firebaseUser.uid, ...newUser }
}

export async function signInWithEmail(email: string, password: string): Promise<User> {
  const result = await signInWithEmailAndPassword(auth, email, password)
  const firebaseUser = result.user
  
  // Buscar usuário no Firestore
  const userRef = doc(db, 'users', firebaseUser.uid)
  const userDoc = await getDoc(userRef)
  
  if (!userDoc.exists()) {
    throw new Error('Usuário não encontrado no banco de dados')
  }
  
  return { id: userDoc.id, ...userDoc.data() } as User
}

export async function signOut(): Promise<void> {
  await firebaseSignOut(auth)
}

export async function getCurrentUser(firebaseUser: FirebaseUser): Promise<User | null> {
  const userRef = doc(db, 'users', firebaseUser.uid)
  const userDoc = await getDoc(userRef)
  
  if (!userDoc.exists()) {
    return null
  }
  
  return { id: userDoc.id, ...userDoc.data() } as User
}
