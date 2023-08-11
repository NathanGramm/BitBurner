/**
 * 
 * Used to Grow and Weaken the server so that the server is at max money and minimum security
 * Then does a chain of hacks, weakens, grows, weakens so that we always hack the max amount of money per thread
 * and grow with the least amount of threads while maintaining max money and minimum security
 * 
 */



import { serverList } from "./functions.js"
import { rootAccess } from "./functions.js"

/** @param {NS} ns */
export async function main(ns) {
	const targets = serverList(ns);
	let score = -Infinity;
	let bestTarget = "n00dles";
	const ramPerThread = ns.getScriptRam("weaken.js");
	let weakenPerThread = ns.weakenAnalyze(1);
	let hwThreads = ns.hackAnalyzeSecurity(1);
	let gwThreads = ns.hackAnalyzeSecurity(1);

	const reservedHomeRam = 1050;
	const sleepIteration = 1;
	const pauseIteration = 10;

	while (true) {
		let servers = ns.getPurchasedServers();
		servers = servers.concat("home");
		for (let target of targets) {
			if (!target.startsWith("hacknet"))
				servers.push(target);
			const maxTime = 30;
			if (!ns.serverExists(target)
				|| ns.getServerMaxMoney(target) == 0
				|| ns.getServerRequiredHackingLevel(target) > ns.getHackingLevel()
				|| !rootAccess(ns, target)
				|| ns.getWeakenTime(target) > 1000 * 60 * maxTime)
				continue;
			let hackThreads = Math.ceil(ns.hackAnalyzeThreads(target, ns.getServerMaxMoney(target)))
			let threads = Math.ceil((hackThreads / 25) + (ns.getServerSecurityLevel(target) - ns.getServerMinSecurityLevel(target)) * 20)
			let gr1 = 0; let gr2 = 0;
			gr1 = ns.getServerMaxMoney(target) / ns.getServerMoneyAvailable(target) == Infinity ? 500 : ns.getServerMaxMoney(target) / ns.getServerMoneyAvailable(target)
			gr2 = ns.getServerMaxMoney(target) / ns.getServerMaxMoney(target) == Infinity ? 500 : ns.getServerMaxMoney(target) / ns.getServerMaxMoney(target)
			var grThreads = Math.ceil(ns.growthAnalyze(target, gr1))
			grThreads += Math.ceil(ns.growthAnalyze(target, gr2))
			threads += Math.ceil(grThreads / 12.5)
			threads += grThreads + hackThreads;
			threads += hackThreads + grThreads;
			const neededGBRam = threads;
			const newScore = ns.hackAnalyze(target) / ns.hackAnalyzeChance(target) * ns.getServerMaxMoney(target) / neededGBRam / ns.getWeakenTime(target);
			if (newScore > score && ns.hasRootAccess(target)) {
				score = newScore;
				bestTarget = target;
			}
		}

		const minHackLevel = 750;
		let earlyGameCheck = false;
		if (ns.getHackingLevel() < minHackLevel && ns.serverExists(bestTarget) && ns.hasRootAccess(bestTarget) && ns.getServerMaxMoney(bestTarget) > 1)
			earlyGameCheck = true;
		for (let target of targets) {
			if (earlyGameCheck)
				target = bestTarget;
			if (!ns.serverExists(target) || !ns.hasRootAccess(target) || ns.getServerMaxMoney(target) < 1)
				continue
			const serverMaxMoney = ns.getServerMaxMoney(target);
			const serverMinSecurityLevel = ns.getServerMinSecurityLevel(target);
			let currentSecurityLevel = ns.getServerSecurityLevel(target);
			let availableMoney = Math.max(1, ns.getServerMoneyAvailable(target));
			let growthCalculated = false;
			let requiredGrowThreads = 0;
			let batchDelay = 0;

			for (let server of servers) {
				if (!ns.serverExists(server) || !ns.hasRootAccess(server))
					continue;
				ns.scp(["weaken.js", "grow.js", "hack.js"], server, "home");
				let threadsToUse = Math.floor(((ns.getServerMaxRam(server)) - ns.getServerUsedRam(server) - (server == "home" ? reservedHomeRam : 0)) / ramPerThread);
				if (threadsToUse < 1)
					continue;
				let serverCores = 1;
				if (server == "home") {
					serverCores = ns.getServer("home").cpuCores;
					hwThreads = ns.hackAnalyzeSecurity(1) / weakenPerThread;
					gwThreads = ns.growthAnalyzeSecurity(1, target, serverCores) / weakenPerThread;
				}
				weakenPerThread = ns.weakenAnalyze(1, serverCores);

				if (currentSecurityLevel > serverMinSecurityLevel) {
					const reducedSecurityLevel = weakenPerThread * threadsToUse;
					if (currentSecurityLevel - reducedSecurityLevel < serverMinSecurityLevel) {
						threadsToUse = Math.ceil((currentSecurityLevel - serverMinSecurityLevel) / weakenPerThread);
						currentSecurityLevel = serverMinSecurityLevel;
					} else {
						currentSecurityLevel -= reducedSecurityLevel;
						ns.exec("weaken.js", server, threadsToUse, target, 0, performance.now());
					}
				} else if (availableMoney < serverMaxMoney && (requiredGrowThreads != 0 || !growthCalculated)) {
					if (!growthCalculated) {
						requiredGrowThreads = Math.ceil(ns.growthAnalyze(target, serverMaxMoney / availableMoney, serverCores));
						growthCalculated = true;
					}
					threadsToUse = Math.min(requiredGrowThreads, threadsToUse);
					requiredGrowThreads -= threadsToUse;

					currentSecurityLevel += ns.growthAnalyzeSecurity(threadsToUse, target, serverCores);
					ns.exec("grow.js", server, threadsToUse, target, 0, performance.now());
				} else {
					const hackMoneyPercentage = ns.hackAnalyze(target);
					if (hackMoneyPercentage == 0)
						continue;

					let hackThreads = Math.ceil(threadsToUse / 8);
					let growThreads, weakenThreads, weakenThreads2, goLower = false;
					while (true) {
						// if (hackMoneyPercentage * hackThreads > 1)
						// 	hackThreads = Math.ceil(1 / hackMoneyPercentage);
						growThreads = Math.ceil(ns.growthAnalyze(target, 1 / (1 - Math.min(0.99, hackMoneyPercentage * hackThreads)), serverCores));
						weakenThreads = Math.ceil(hwThreads * hackThreads);
						weakenThreads2 = Math.max(1, Math.ceil(gwThreads * growThreads));

						let threadUsage = (hackThreads + growThreads + weakenThreads + weakenThreads2) / threadsToUse;
						if (threadUsage > 1) {
							if (hackThreads > 1) {
								hackThreads--;
								goLower = true;
							} else {
								break;
							}
						} else if (Math.floor((1 - threadUsage) * hackThreads) > 1) {
							hackThreads += Math.floor((1 - threadUsage) * hackThreads / 2);
							if (goLower) { break; }
						} else {
							break;
						}
						await ns.sleep(1);
					}
					const threadDelay = 100;
					ns.exec("weaken.js", server, weakenThreads, target, batchDelay, performance.now());
					ns.exec("weaken.js", server, weakenThreads2, target, batchDelay + threadDelay * 2, performance.now());
					ns.exec("grow.js", server, growThreads, target, batchDelay + threadDelay + ns.getWeakenTime(target) - ns.getGrowTime(target), performance.now());
					ns.exec("hack.js", server, hackThreads, target, batchDelay - threadDelay + ns.getWeakenTime(target) - ns.getHackTime(target), performance.now());
					batchDelay += 4 * threadDelay;
				}
				await ns.sleep(sleepIteration);
			}
			await ns.sleep(sleepIteration);
		}
		await ns.sleep(pauseIteration * 1000);
	}
}