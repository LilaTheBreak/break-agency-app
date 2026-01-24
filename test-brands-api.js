#!/usr/bin/env node

/**
 * Test brands API endpoint
 */

const API_URL = 'http://localhost:5001';
const authToken = 'test-token'; // We'll test with dev auth

async function testBrandsAPI() {
  try {
    console.log('[TEST] Fetching brands from', API_URL + '/api/brands');
    
    const response = await fetch(API_URL + '/api/brands', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    });

    console.log('[TEST] Response status:', response.status);
    console.log('[TEST] Response headers:', Object.fromEntries(response.headers));
    
    const data = await response.json();
    console.log('[TEST] Response body:', JSON.stringify(data, null, 2));
    
    if (response.ok) {
      console.log('[TEST] ✅ API returned successfully');
      if (data.brands && Array.isArray(data.brands)) {
        console.log('[TEST] ✅ Brands array has', data.brands.length, 'items');
      } else {
        console.log('[TEST] ❌ Response missing brands array');
      }
    } else {
      console.log('[TEST] ❌ API returned error');
    }
  } catch (error) {
    console.error('[TEST] Error:', error.message);
  }
}

testBrandsAPI();
