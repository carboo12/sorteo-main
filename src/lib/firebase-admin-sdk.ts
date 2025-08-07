
import * as admin from 'firebase-admin';

const serviceAccount = {
    "type": "service_account",
    "project_id": "sorteo-xpress",
    "private_key_id": "2f3a783349d791ab06ec5f949c4da4782c7cdb9c",
    "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQDA3iO2lqyYDwja\nDk0iIVcuPopnUvMmFb3wWI+YFr0xNSDBbMHxtLQwyTCOw2zIXl8Vsm7g+kr4Imr8\nr+f+h8e1ERqNS4xy+KQCcR+kiU2hLH9Y64LqCvMcTAk1wqH+wB8VX1PtCRWmNLag\n6NgEaEL7LERaZzKJxAfVl9VCrFgaeJItRCwFzyNOJG8l1HdtY+iKVt+bQ9l//l9T\nEZg2hv7FAuNiY6/PWyzoQumvP0QIldZ+et83lioZitE+/s2sY5g2CiITC4MGmC5f\nmCTUdHwzuwh47VRC+WhgaC8pZLXut+QuNkda3AJyVBVnI4Zf4g9yljx4lXT2IurP\ntNEBn365AgMBAAECggEAW4eQr1BmbGuGKeXrmSz1cM7hZBOrrQFYeL2ut+DivH2Y\nI/N3Pzwg3547WyVHdPfEbEmX8VEXTxcWawEYOmU506ZgUXnvF4kEXNxOxgkbPEgf\nz5VFNckogt9a55aMxpdqqPvqmm1bRttxaH/YNI8+anEhpz2ecF8F0MoTvWaJEVYg\nJ5LRK2J6z0StrLNwEWmuOPF5vA58GwXKpCNnhTpG+aDDzo09jmmmhxgF/yBcSGVX\nWWSVW8Rn8xZpU6OtmEOxGGp8O/HrqVKMRAo6Tj8Bfgp+0bZ6TpgtNDN0mT8TX7Ce\n7Mv+f47ojLA62wbg96G2o5ZRoHs6B0raGBa+tbzqGQKBgQDielysxzBRcvo5nxvo\nqKQLNB615VG8kEj3c+EzKmo2fT8pA1RuvfvdOCqicl72DYYX69ZrXDVfENDKOD17\n57gk88rhB+YVEbAOdi+puDxGFK0wn7BH9apTOxWtBSOzslQsxU+K8CsqvR3RFA/o\n1bdaktyJ9mDxrTmrdqkNeCa8twKBgQDaAjGNpazX/52qYN2fqwFJleWRU4BcCgQD\nr1Vv240iMkRy4fTdYIcob7lZgEj1Szv/DFzacey43T9mHDrQpB0kTmp6U9+3Yh0a\nRuQ9NZfXUx+VAuSdPaIV4iskJ4yMLkxRpY5bhnvEspaOghxS5Z+3SHs/QHcpwqgU\nX9Z8f+kQDwKBgH/w/i/BKyOoH4Gzx9Fsi5ekrwC09rLek8nvFbaQ7IWxxZ+GuQkC\nnKlBVJyGnezEgQ88dNobsi7tUfYbRWic4+NEMkVj7+/RGTNiQtTPNoWkop5IaA6O\n0tTIGRuwPpYCVRkhsijcOpafVZvKiJ5RNY6eTqZFoEiHQoABvcjVKpULAoGAMppH\nvkUydYCTrDSHvMQIrHfqrWzgYnzAqcpM3oXroIBievgPykLZnH0yXJ/2T1mDN5Q7\nCUlgVRil2qG61SsCyKaa+IH3b62Ka8sAt2R1NjnJHuFpB0aDFOlGckHr0a39cQYo\noP36RJHfeHyi7mr2Q6jDUs832a2hLfmA460c/+kCgYAPfkF26bmIXIC1rCUEAlC0\nh3xMlxe6j8nogKAqg+kQ8GUckKYEtqkqAKBwb4tKBwcaDoawfiwbFLhFQdawgmX4\nJnH8VcGwT8DwmpPpVAr7SgSh01gOue4f6aBAKG+sPBkSl87/aN/5+jPBZhwzxNQ1\n4S4jZPVSwYxthLr6JMxIng==\n-----END PRIVATE KEY-----\n",
    "client_email": "firebase-adminsdk-fbsvc@sorteo-xpress.iam.gserviceaccount.com",
};

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log('Firebase Admin SDK initialized successfully.');
  } catch (error: any) {
    console.error('Error initializing Firebase Admin SDK:', error.stack);
  }
}

const adminFirestore = admin.firestore();
const adminAuth = admin.auth();

export { admin, adminFirestore, adminAuth };
