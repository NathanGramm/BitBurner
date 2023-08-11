// Used to farm intelligence by using bladeburner points to boost exp gains over time
export async function main(ns) {
	ns.disableLog("ALL");
	let sleeveTimeOffline = [];
	let lastOfflineTimeCheck = [];
	let timeCheck = performance.now();
	let sleeveToSwitchFrom;
	let numberOfSleeves = ns.sleeve.getNumSleeves();
	for (let i = 0; i < numberOfSleeves; i++) {
		sleeveTimeOffline[i] = 0;
		if (i === 0) ns.sleeve.setToBladeburnerAction(i, "Infiltrate synthoids")
		else ns.sleeve.setToIdle(i);
	}
	let sleepinterval = 100;
	while (true) {
		let start = performance.now();
		ns.clearLog();
		ns.print("Time to next switch: " + ns.formatNumber(Math.floor((300000 - Math.floor(performance.now() - timeCheck)) / 60000), 0) + ":" + (+ ns.formatNumber(((300000 - (performance.now() - timeCheck)) / 1000) % 60, 0) < 10 ? "0" : "") + ns.formatNumber(((300000 - (performance.now() - timeCheck)) / 1000) % 60, 0))
		numberOfSleeves = ns.sleeve.getNumSleeves();
		for (let i = 0; i < numberOfSleeves; i++) {
			let currentTask = ns.sleeve.getTask(i);
			if (currentTask != null && currentTask.type === "INFILTRATE") {
				sleeveTimeOffline[i] = 0;
				sleeveToSwitchFrom = i;
			} else {
				sleeveTimeOffline[i] += performance.now() - (lastOfflineTimeCheck[i] != null ? lastOfflineTimeCheck[i] : performance.now());
				lastOfflineTimeCheck[i] = performance.now();
			}
			if (performance.now() - timeCheck > 300000 && sleeveToSwitchFrom === i) {
				let sleeveToSwitchTo = 0;
				for (let j = 0; j < numberOfSleeves; j++) {
					sleeveToSwitchTo = sleeveTimeOffline[j] > sleeveTimeOffline[sleeveToSwitchTo] ? j : sleeveToSwitchTo
				}
				ns.sleeve.setToIdle(i)
				ns.sleeve.setToBladeburnerAction(sleeveToSwitchTo, "Infiltrate synthoids");
				sleeveToSwitchFrom = ((i + 1) % numberOfSleeves);
				timeCheck = performance.now();
			}
		}
		let end = performance.now();
		sleepinterval = (end-start) < 1000 ? (end-start) : 100;
		await ns.sleep(sleepinterval);
	}
}