import { io } from 'socket.io-client';
import axios from 'axios';

const BASE_URL = 'http://127.0.0.1:5001/api/v1';
const WS_URL = 'http://127.0.0.1:5001/auctions';
const CONCURRENT_USERS = 1000;
const TEST_DURATION_MS = 30000; // 30 seconds

async function runStressTest() {
  console.log('🚀 Initializing Stress Test...');
  
  // 1. Get Authentication Token
  let token = '';
  try {
    const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@mototrad.com',
      password: 'Password123!'
    });
    token = loginRes.data.accessToken;
    console.log('🔑 Authenticated successfully.');
  } catch (err: any) {
    console.error(`❌ Failed to authenticate: ${err.message}`);
    if (err.response) console.error(err.response.data);
    return;
  }

  // 2. Get an Active Auction
  const auctionId = '4fdafd68-b22b-4f8c-86e2-6a82a2a59fb4';
  console.log(`🎯 Targeting Auction: ${auctionId}`);


  const clients: any[] = [];
  let successfulBids = 0;
  let failedBids = 0;
  let totalLatency = 0;

  console.log(`📡 Connecting ${CONCURRENT_USERS} users...`);

  for (let i = 0; i < CONCURRENT_USERS; i++) {
    const socket = io(WS_URL, {
      auth: { token },
      transports: ['websocket'],
      forceNew: true
    });

    socket.on('connect', () => {
      socket.emit('join_auction', { auctionId });
    });

    socket.on('bid_placed', (data) => {
      // console.log(`[User ${i}] Bid placed: $${data.amount}`);
    });

    socket.on('bid_error', (err) => {
      failedBids++;
    });

    clients.push(socket);

    // Stagger connections to prevent local OS port exhaustion
    if (i % 100 === 0) await new Promise(r => setTimeout(r, 100));
  }

  console.log('✅ All users connected. Starting rapid bidding simulation...');

  const startTime = Date.now();
  let currentBaseBid = 50000;

  const bidInterval = setInterval(() => {
    if (Date.now() - startTime > TEST_DURATION_MS) {
        clearInterval(bidInterval);
        return;
    }

    const randomIndex = Math.floor(Math.random() * clients.length);
    const client = clients[randomIndex];
    
    currentBaseBid += 100;
    const bidAmount = currentBaseBid;
    
    const bidStart = Date.now();
    client.emit('place_bid', { auctionId, amount: bidAmount });
    successfulBids++;
    totalLatency += (Date.now() - bidStart);

  }, 50); // 20 bids per second

  // Simulate random disconnects
  const disconnectInterval = setInterval(() => {
      if (Date.now() - startTime > TEST_DURATION_MS) {
          clearInterval(disconnectInterval);
          return;
      }
      const randomIndex = Math.floor(Math.random() * clients.length);
      clients[randomIndex].disconnect();
      setTimeout(() => clients[randomIndex].connect(), 1000);
  }, 2000);

  // Wait for test to finish
  await new Promise(r => setTimeout(r, TEST_DURATION_MS + 2000));

  console.log('\n--- 📊 STRESS TEST RESULTS ---');
  console.log(`Total Concurrent Users: ${CONCURRENT_USERS}`);
  console.log(`Successful Bids Sent: ${successfulBids}`);
  console.log(`Failed Bids (Server Errors): ${failedBids}`);
  console.log(`Avg Request Latency: ${(totalLatency / successfulBids).toFixed(2)}ms`);
  console.log(`Throughput: ${(successfulBids / (TEST_DURATION_MS/1000)).toFixed(2)} bids/sec`);
  console.log('------------------------------\n');

  clients.forEach(c => c.disconnect());
  process.exit(0);
}

runStressTest();
