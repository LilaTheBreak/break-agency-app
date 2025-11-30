import { useState, useCallback, useEffect } from 'react';
import { useDebounce } from 'use-debounce';
import * as emailApi from '../services/emailApi';

export function useEmailComposer(initialState = {}) {
  const [subject, setSubject] = useState(initialState.subject || '');
  const [body, setBody] = useState(initialState.body || '');
  const [recipients, setRecipients] = useState(initialState.recipients || { to: [], cc: [], bcc: [] });
  const [attachments, setAttachments] = useState(initialState.attachments || []);
  const [draftId, setDraftId] = useState(initialState.draftId || null);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);

  const [debouncedState] = useDebounce({ subject, body, recipients, attachments, draftId }, 10000);

  const saveDraft = useCallback(async () => {
    try {
      const payload = { id: draftId, subject, body, recipients, attachments };
      const savedDraft = await emailApi.saveDraft(payload);
      setDraftId(savedDraft.id);
      console.log('Draft saved');
    } catch (err) {
      console.error('Failed to save draft:', err);
    }
  }, [draftId, subject, body, recipients, attachments]);

  useEffect(() => {
    if (draftId) { // Only autosave if it's a draft
      saveDraft();
    }
  }, [debouncedState, saveDraft, draftId]);

  const send = useCallback(async () => {
    setIsSending(true);
    setError(null);
    try {
      const payload = { to: recipients.to, cc: recipients.cc, bcc: recipients.bcc, subject, bodyHTML: body, attachments, draftId };
      await emailApi.sendEmail(payload);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSending(false);
    }
  }, [recipients, subject, body, attachments, draftId]);

  const generateAIReply = useCallback(async (context) => {
    setIsSending(true); // Use same loading state
    try {
      const { text } = await emailApi.generateAIReply(context);
      setBody(text);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSending(false);
    }
  }, []);

  const setField = (field, value) => {
    if (field === 'subject') setSubject(value);
    if (field === 'body') setBody(value);
    if (field === 'recipients') setRecipients(value);
    if (field === 'attachments') setAttachments(value);
  };

  return {
    subject,
    body,
    recipients,
    attachments,
    isSending,
    error,
    setField,
    saveDraft,
    send,
    generateAIReply,
  };
}