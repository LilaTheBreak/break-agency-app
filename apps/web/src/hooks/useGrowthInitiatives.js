import { useState, useCallback, useEffect } from 'react';
import { apiFetch } from '../lib/apiFetch.js';

/**
 * useGrowthInitiatives
 * Hook for managing growth initiatives for a specific talent
 */
export function useGrowthInitiatives(talentId) {
  const [initiatives, setInitiatives] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchInitiatives = useCallback(async () => {
    if (!talentId) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const res = await apiFetch(`/api/growth-initiatives?talentId=${talentId}`);
      if (!res.ok) throw new Error('Failed to fetch initiatives');
      
      const data = await res.json();
      setInitiatives(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('[useGrowthInitiatives] Error:', err);
      setError(err.message);
      setInitiatives([]);
    } finally {
      setIsLoading(false);
    }
  }, [talentId]);

  useEffect(() => {
    fetchInitiatives();
  }, [fetchInitiatives]);

  const createInitiative = useCallback(async (data) => {
    try {
      const res = await apiFetch('/api/growth-initiatives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, talentId }),
      });
      
      if (!res.ok) throw new Error('Failed to create initiative');
      const newInitiative = await res.json();
      setInitiatives(prev => [newInitiative, ...prev]);
      return newInitiative;
    } catch (err) {
      console.error('[useGrowthInitiatives] Create error:', err);
      throw err;
    }
  }, [talentId]);

  const updateInitiative = useCallback(async (initiativeId, data) => {
    try {
      const res = await apiFetch(`/api/growth-initiatives/${initiativeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!res.ok) throw new Error('Failed to update initiative');
      const updated = await res.json();
      setInitiatives(prev => prev.map(i => i.id === initiativeId ? updated : i));
      return updated;
    } catch (err) {
      console.error('[useGrowthInitiatives] Update error:', err);
      throw err;
    }
  }, []);

  const addInput = useCallback(async (initiativeId, inputData) => {
    try {
      const res = await apiFetch('/api/growth-initiatives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...inputData, initiativeId }),
      });
      
      if (!res.ok) throw new Error('Failed to add input');
      const newInput = await res.json();
      
      setInitiatives(prev => prev.map(i => 
        i.id === initiativeId 
          ? { ...i, inputs: [...(i.inputs || []), newInput] }
          : i
      ));
      return newInput;
    } catch (err) {
      console.error('[useGrowthInitiatives] Add input error:', err);
      throw err;
    }
  }, []);

  const addOutput = useCallback(async (initiativeId, outputData) => {
    try {
      const res = await apiFetch('/api/growth-initiatives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...outputData, initiativeId }),
      });
      
      if (!res.ok) throw new Error('Failed to add output');
      const newOutput = await res.json();
      
      setInitiatives(prev => prev.map(i => 
        i.id === initiativeId 
          ? { ...i, outputs: [...(i.outputs || []), newOutput] }
          : i
      ));
      return newOutput;
    } catch (err) {
      console.error('[useGrowthInitiatives] Add output error:', err);
      throw err;
    }
  }, []);

  const addPerformance = useCallback(async (initiativeId, performanceData) => {
    try {
      const res = await apiFetch(`/api/growth-initiatives/${initiativeId}/performance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(performanceData),
      });
      
      if (!res.ok) throw new Error('Failed to add performance');
      const newPerformance = await res.json();
      
      setInitiatives(prev => prev.map(i => 
        i.id === initiativeId 
          ? { ...i, performance: [newPerformance, ...(i.performance || [])] }
          : i
      ));
      return newPerformance;
    } catch (err) {
      console.error('[useGrowthInitiatives] Add performance error:', err);
      throw err;
    }
  }, []);

  const addBusinessImpact = useCallback(async (initiativeId, impactData) => {
    try {
      const res = await apiFetch(`/api/growth-initiatives/${initiativeId}/impact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(impactData),
      });
      
      if (!res.ok) throw new Error('Failed to record impact');
      const newImpact = await res.json();
      
      setInitiatives(prev => prev.map(i => 
        i.id === initiativeId 
          ? { ...i, businessImpacts: [newImpact, ...(i.businessImpacts || [])] }
          : i
      ));
      return newImpact;
    } catch (err) {
      console.error('[useGrowthInitiatives] Add impact error:', err);
      throw err;
    }
  }, []);

  return {
    initiatives,
    isLoading,
    error,
    refresh: fetchInitiatives,
    createInitiative,
    updateInitiative,
    addInput,
    addOutput,
    addPerformance,
    addBusinessImpact,
  };
}

/**
 * useAllGrowthInitiatives
 * Hook for admin to view all initiatives across all talent
 */
export function useAllGrowthInitiatives() {
  const [initiatives, setInitiatives] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAll = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const res = await apiFetch('/api/growth-initiatives/admin/all');
      if (!res.ok) throw new Error('Failed to fetch initiatives');
      
      const data = await res.json();
      setInitiatives(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('[useAllGrowthInitiatives] Error:', err);
      setError(err.message);
      setInitiatives([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return {
    initiatives,
    isLoading,
    error,
    refresh: fetchAll,
  };
}
