import { useState, useEffect, useCallback } from 'react';
import {
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  Timestamp,
  orderBy,
  query,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { broadcastTemplatesCollection } from '@/lib/collections';
import type { BroadcastTemplate } from '@/types';

export function useBroadcastTemplates() {
  const [templates, setTemplates] = useState<BroadcastTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Listen for templates
  useEffect(() => {
    const q = query(broadcastTemplatesCollection, orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items: BroadcastTemplate[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        items.push({
          id: docSnap.id,
          text: data.text,
          link: data.link,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
        });
      });
      setTemplates(items);
      setIsLoading(false);
    }, (error) => {
      console.error('[BroadcastTemplates] Error:', error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Create a new template
  const createTemplate = useCallback(async (text: string, link?: string) => {
    if (!text.trim()) return;
    
    try {
      await addDoc(broadcastTemplatesCollection, {
        text: text.trim(),
        link: link?.trim() || undefined,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('[BroadcastTemplates] Error creating template:', error);
    }
  }, []);

  // Update an existing template
  const updateTemplate = useCallback(async (id: string, updates: { text?: string; link?: string }) => {
    if (!id) return;
    
    try {
      const docRef = doc(db, 'broadcast_templates', id);
      const updateData: Record<string, string | undefined> = {};
      if (updates.text !== undefined) updateData.text = updates.text.trim();
      if (updates.link !== undefined) updateData.link = updates.link?.trim() || undefined;
      
      await updateDoc(docRef, updateData);
    } catch (error) {
      console.error('[BroadcastTemplates] Error updating template:', error);
    }
  }, []);

  // Delete a template
  const deleteTemplate = useCallback(async (id: string) => {
    if (!id) return;
    
    try {
      await deleteDoc(doc(db, 'broadcast_templates', id));
    } catch (error) {
      console.error('[BroadcastTemplates] Error deleting template:', error);
    }
  }, []);

  return {
    templates,
    isLoading,
    createTemplate,
    updateTemplate,
    deleteTemplate,
  };
}
