#!/usr/bin/env node

import { execSync } from 'child_process';

const logger = new Proxy(console, {});

/**
 * グローバルIPアドレスのCIDRマージツール
 *
 * 機能：
 * - ログからグローバルIPアドレスを抽出
 * - /32 → /31 → ... → /20 の順で最適なCIDRにマージ
 * - できるだけ狭いCIDRを選択（より具体的な範囲を優先）
 * - リストを最小化
 *
 * アルゴリズム：
 * 1. すべてのIPアドレスを集合として管理
 * 2. 各IPについて、/20から/32まで順に試す
 * 3. そのCIDRの全IPアドレスが集合に含まれている場合、そのCIDRを採用
 * 4. より広い範囲を優先（/20から順に試すため）
 * 5. 重複をカバー済みとしてマーク
 */

const main = (minimum = 19) => {
  // 生 IP を取得
  const raw = execSync(
    'grep -P "Global.+\\d" /var/log/daemon/* | awk \'{print $2}\' | sort -u',
    { encoding: 'utf8' },
  ).trim();

  if (!raw) process.exit(0);

  const ips = raw.split('\n');

  // IPv4文字列を32ビット符号なし整数に変換
  const ipToInt = ip => {
    return ip.split('.').reduce((a, x) => (a << 8) + Number.parseInt(x, 10), 0) >>> 0;
  };

  // 32ビット符号なし整数をIPv4文字列に変換
  const intToIp = int => {
    return [
      int >>> 24 & 255,
      int >>> 16 & 255,
      int >>> 8 & 255,
      int & 255,
    ].join('.');
  };

  // 指定されたマスクのネットワークアドレスを計算
  const networkOf = (ipInt, mask) => {
    const maskBits = mask === 0 ? 0 : ~0 << 32 - mask >>> 0;
    return (ipInt & maskBits) >>> 0;
  };
  // 初期状態：すべて /32
  const firstNets = ips.map(ip => ({
    base: ipToInt(ip),
    mask: 32,
  }));

  // すべてのIPアドレスを集合として取得
  const getIpSet = nets => {
    const set = new Set();
    for (const n of nets) {
      set.add(n.base);
    }
    return set;
  };

  /**
   * 最適なCIDRリストを生成（貪欲法）
   *
   * アプローチ：
   * - 各IPから開始して、最も多くのIPをカバーするCIDRを選択
   * - カバー数が同じ場合は、より狭い範囲（大きいマスク値）を優先
   * - リスト削減を最優先
   */
  const optimizeCidrs = ipSet => {
    const result = [];
    const covered = new Set();
    const sortedIps = Array.from(ipSet).sort((a, b) => a - b);

    for (const ip of sortedIps) {
      if (covered.has(ip)) continue;

      // /19から/32まで、最適な範囲を探す
      let bestMask = 32;
      let bestBase = ip;
      let bestCoverage = 0;

      for (let mask = minimum; mask <= 32; mask++) {
        const base = networkOf(ip, mask);
        const size = 1 << 32 - mask;

        // このCIDRでカバーできる新規IP数をカウント
        let newCoverage = 0;
        for (let i = 0; i < size; i++) {
          const addr = base + i;
          if (ipSet.has(addr) && !covered.has(addr)) {
            newCoverage++;
          }
        }

        if (newCoverage === 0) continue;

        // 1個のIPの場合は/32のみ許可
        if (newCoverage === 1 && mask < 32) {
          continue;
        }

        // より多くカバーする、または同数ならより狭い範囲を選択
        if (newCoverage > bestCoverage || newCoverage === bestCoverage && mask > bestMask) {
          bestMask = mask;
          bestBase = base;
          bestCoverage = newCoverage;
        }
      }

      result.push({ base: bestBase, mask: bestMask });

      // カバーしたIPをマーク
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

  // 出力（ネットワークアドレス順、同じアドレスならマスク順）
  finalNets
  .sort((a, b) => a.base - b.base || a.mask - b.mask)
  .forEach(n => {
    logger.info(`${intToIp(n.base)}/${n.mask}`);
  });
};

main(...process.argv.slice(2));
