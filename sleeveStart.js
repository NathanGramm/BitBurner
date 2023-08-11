import { runCom1 } from "./functions.js"

/** @param {NS} ns */
export async function main(ns) {
	ns.disableLog("ALL");
	const shockThreshold = 33;
	const syncThreshold = 100;
	const strengthThreshold = 60;
	while (true) {
		let numberOfSleeves = await runCom1(ns, 'ns.sleeve.getNumSleeves()', 'getNumSleeves');
		await ns.sleep(200);
		let inAGang = await runCom1(ns, 'ns.gang.inGang()', 'inGang');
		await ns.sleep(200);
		for (let i = 0; i < numberOfSleeves; ++i) {
			let currentSleeve = ns.sleeve.getSleeve(i);
			let currentTask = ns.sleeve.getTask(i);
			for (const skill in currentSleeve.skills) {
				ns.print(currentSleeve.skills.skill);
			}
			ns.print(currentSleeve.skills);
			if (currentSleeve.shock > shockThreshold) {
				ns.print("Current shock level: " + ns.formatNumber(currentSleeve.shock, 2));
				if (currentTask.type != "RECOVERY") {
					await runCom1(ns, 'ns.sleeve.setToShockRecovery(ns.args[0])', 'setToShockRecovery', [i]);
					await ns.sleep(200);
				}
			} else if (currentSleeve.sync < syncThreshold) {
				ns.print("Current synchronize level: " + ns.formatNumber(currentSleeve.sync, 2));
				if (currentTask.type != "SYNCHRO") {
					await runCom1(ns, 'ns.sleeve.setToSynchronize(ns.args[0])', 'setToSynchronize', [i]);
					await ns.sleep(200);
				}
			} else if (!inAGang) {
				if (currentSleeve.skills.strength < strengthThreshold) {
					if (currentSleeve.skills.agility < 60 && !(currentTask.type == "CLASS" && currentTask.classType == "agi")) {
						ns.print("Current agility level: " + ns.formatNumber(currentSleeve.skills.agility, 2));
						await runCom1(ns, 'ns.sleeve.setToGymWorkout(ns.args[0], ns.args[1], ns.args[2])', 'setToGymWorkout', [i, "powerhouse gym", "agi"]);
						await ns.sleep(200);
					} else if (currentSleeve.skills.defense < 60 && !(currentTask.type == "CLASS" && currentTask.classType == "def")) {
						ns.print("Current defense level: " + ns.formatNumber(currentSleeve.skills.defense, 2));
						await runCom1(ns, 'ns.sleeve.setToGymWorkout(ns.args[0], ns.args[1], ns.args[2])', 'setToGymWorkout', [i, "powerhouse gym", "def"]);
						await ns.sleep(200);
					} else if (currentSleeve.skills.dexterity < 60 && !(currentTask.type == "CLASS" && currentTask.classType == "dex")) {
						ns.print("Current dexterity level: " + ns.formatNumber(currentSleeve.skills.dexterity, 2));
						await runCom1(ns, 'ns.sleeve.setToGymWorkout(ns.args[0], ns.args[1], ns.args[2])', 'setToGymWorkout', [i, "powerhouse gym", "dex"]);
						await ns.sleep(200);
					} else if (currentSleeve.skills.strength < 60 && !(currentTask.type == "CLASS" && currentTask.classType == "str")) {
						ns.print("Current strength level: " + ns.formatNumber(currentSleeve.skills.strength, 2));
						await runCom1(ns, 'ns.sleeve.setToGymWorkout(ns.args[0], ns.args[1], ns.args[2])', 'setToGymWorkout', [i, "powerhouse gym", "str"]);
						await ns.sleep(200);
					}
					
				} else if (currentTask == null || (currentTask.type != "CRIME" && ns.heart.break() < -54000)) {
					ns.print("Setting to Homicide");
					await runCom1(ns, 'ns.sleeve.setToCommitCrime(ns.args[0], ns.args[1])', 'setToCommitCrime', [i, "Homicide"])
					await ns.sleep(200);
				}
			} else if (currentTask == null || currentTask.type != "FACTION") {
				ns.print("Setting sleeve " + i + " to faction work");
				await runCom1(ns, 'ns.sleeve.setToFactionWork(ns.args[0], ns.args[1], ns.args[2])', 'setToFactionWork', [i, factions[i], "hacking"]);
				await ns.sleep(200);
			}
		}
		await ns.sleep(10000);
	}
}
const factions = [
	"Daedalus",
	"Sector-12",
	"BitRunners"
]