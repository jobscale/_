#!/usr/bin/env node

import { execSync } from 'child_process';

const logger = new Proxy(console, {});

const main = (minimum = 19) => {
  const raw = execSync(
    "grep -P 'Global.+\\d' /var/log/daemon/* | awk '{print $2}' | sort -u",
    { encoding: 'utf8' },
  ).trim();

  if (!raw) process.exit(0);

  const ips = raw.split('\n');
  const ipToInt = ip => ip.split('.').reduce((a, x) => (a << 8) + Number.parseInt(x, 10), 0) >>> 0;
  const intToIp = int => [
    int >>> 24 & 255,
    int >>> 16 & 255,
    int >>> 8 & 255,
    int & 255,
  ].join('.');
  const networkOf = (ipInt, mask) => {
    const maskBits = mask === 0 ? 0 : ~0 << 32 - mask >>> 0;
    return (ipInt & maskBits) >>> 0;
  };
  const firstNets = ips.map(ip => ({
    base: ipToInt(ip),
    mask: 32,
  }));

  const getIpSet = nets => {
    const set = new Set();
    for (const n of nets) {
      set.add(n.base);
    }
    return set;
  };

  const optimizeCidrs = ipSet => {
    const result = [];
    const covered = new Set();
    const sortedIps = Array.from(ipSet).sort((a, b) => a - b);
    for (const ip of sortedIps) {
      if (covered.has(ip)) continue;
      let bestMask = 32;
      let bestBase = ip;
      let bestCoverage = 0;
      for (let mask = minimum; mask <= 32; mask++) {
        const base = networkOf(ip, mask);
        const size = 1 << 32 - mask;
        let newCoverage = 0;
        for (let i = 0; i < size; i++) {
          const addr = base + i;
          if (ipSet.has(addr) && !covered.has(addr)) {
            newCoverage++;
          }
        }
        if (newCoverage === 0) continue;
        if (newCoverage === 1 && mask < 32) {
          continue;
        }
        if (newCoverage > bestCoverage || newCoverage === bestCoverage && mask > bestMask) {
          bestMask = mask;
          bestBase = base;
          bestCoverage = newCoverage;
        }
      }

      result.push({ base: bestBase, mask: bestMask });
      const size = 1 << 32 - bestMask;
      for (let i = 0; i < size; i++) {
        const addr = bestBase + i;
        if (ipSet.has(addr)) {
          covered.add(addr);
        }
      }
    }

    return result;
  };

  const ipSet = getIpSet(firstNets);
  const finalNets = optimizeCidrs(ipSet);
  finalNets
  .sort((a, b) => a.base - b.base || a.mask - b.mask)
  .forEach(n => {
    logger.info(`${intToIp(n.base)}/${n.mask}`);
  });
};

main(...process.argv.slice(2));
