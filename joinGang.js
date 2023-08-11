import {runCom1} from "./functions.js"

/** @param {NS} ns */
export async function main(ns) {
	ns.disableLog("ALL");
    const karmaNeededToStartGang = -54000;
    const sleeveSkillThreshold = 60;
    let inAGang = await runCom1(ns, 'ns.gang.inGang()', 'checkInGang')
	while (!inAGang) {
		let playerCurrentWork = await runCom1(ns, 'ns.singularity.getplayerCurrentWork()', 'getCurrWork');
        await ns.sleep(250);
		// Init the changeCrime variable
		let changeCrime;
		let homicideChance = await runCom1(ns, 'ns.singularity.getCrimeChance(ns.args[0])', 'getCrimeChnc', ["Homicide"]);
        await ns.sleep(250);
		// Start by mugging people until homcide chance is 50% then commit homicide
		if (playerCurrentWork == null || (playerCurrentWork.type === "CRIME" && !(playerCurrentWork.crimeType === "Mug") &&  homicideChance < 0.5)) {
			changeCrime = "MUG";
		} else if (playerCurrentWork == null || (playerCurrentWork.type === "CRIME" && !(playerCurrentWork.crimeType === "Homicide")) && ns.heart.break() > karmaNeededToStartGang && homicideChance > 0.5) {
			changeCrime = "HOMICIDE";
        }
        let numberOfSleeves = await runCom1(ns, 'ns.sleeve.getNumSleeves()', 'getNumSleeves');
        await ns.sleep(250);
        for (let i = 0; i < numberOfSleeves; i++) {
            let currentSleeve = ns.sleeve.getSleeve(i);
            let currentTask = ns.sleeve.getTask(i);
						if (currentSleeve.shock > 33) {
							ns.print("Setting sleeve " + i + " to shock recovery")
							await runCom1(ns, 'ns.sleeve.setToShockRecovery(ns.args[0])', 'setToShockRecovery', [i])
						}
            else if (currentSleeve.skills.strength < sleeveSkillThreshold) {
                if (currentSleeve.skills.agility < 60 && (currentTask == null || !(currentTask.type == "CLASS" && currentTask.classType == "agi"))) {
                    ns.print("Setting sleeve " + i + " to train agility");
                    await runCom1(ns, 'ns.sleeve.setToGymWorkout(ns.args[0], ns.args[1], ns.args[2])', 'setToGymWorkout', [i, "powerhouse gym", "agi"]);
                } else if (currentSleeve.skills.defense < 60 && !(currentTask.type == "CLASS" && currentTask.classType == "def")) {
                    ns.print("Setting sleeve " + i + " to to train defense");
                    await runCom1(ns, 'ns.sleeve.setToGymWorkout(ns.args[0], ns.args[1], ns.args[2])', 'setToGymWorkout', [i, "powerhouse gym", "def"]);
                } else if (currentSleeve.skills.dexterity < 60 && !(currentTask.type == "CLASS" && currentTask.classType == "dex")) {
                    ns.print("Setting sleeve " + i + " to to train dexterity");
                    await runCom1(ns, 'ns.sleeve.setToGymWorkout(ns.args[0], ns.args[1], ns.args[2])', 'setToGymWorkout', [i, "powerhouse gym", "dex"]);
                } else if (currentSleeve.skills.strength < 60 && !(currentTask.type == "CLASS" && currentTask.classType == "str")) {
                    ns.print("Setting sleeve " + i + " to to train strength");
                    await runCom1(ns, 'ns.sleeve.setToGymWorkout(ns.args[0], ns.args[1], ns.args[2])', 'setToGymWorkout', [i, "powerhouse gym", "str"]);
                } 
            } else if (currentTask == null || (currentTask.type != "CRIME" && ns.heart.break() > -54000)) {
                ns.print("Setting sleeve " + i + " to Homicide");
                await runCom1(ns, 'ns.sleeve.setToCommitCrime(ns.args[0], ns.args[1])', 'setToCommitCrime', [i, "Homicide"])
                await ns.sleep(250);
            }
        }
		// **Use in early game or when not using bladeburner**
		// Commit the assigned crime if there is an assigned crime and we are not already doing it
		// Sets the player's focus on the task
		// if ((playerCurrentWork == null && changeCrime != null) || (changeCrime != null && playerCurrentWork.type === "CRIME" && !(playerCurrentWork.crimeType === changeCrime))) {
		// 	await runCom1(ns, 'ns.singularity.commitCrime(ns.args[0])', 'commitCrime', [changeCrime]);
		// 	ns.toast("Set Current Work To: " + changeCrime, "info");
        //     await ns.sleep(250);
		// }
		// If we are not in the slum snakes faction and we have an invitation then join
        let inviteFromSlumSnakes = await runCom1(ns, 'ns.singularity.checkFactionInvitations().includes(ns.args[0])', 'checkInvite', ["Slum Snakes"])
		if (inviteFromSlumSnakes) {
			await runCom1(ns, 'ns.singularity.joinFaction(ns.args[0])', 'joinFaction', ["Slum Snakes"]);
            await ns.sleep(250);
		}
		// If karma is low enough to create a gang then create a gang
        let currentKarma = ns.heart.break();
        if (currentKarma <= karmaNeededToStartGang) {
            let gangConfigExists = await runCom1(ns, 'ns.fileExists(ns.args[0])', 'getFileExist', ["config.gang.txt"]);
            await ns.sleep(250);
            if (gangConfigExists) {await runCom1(ns, 'ns.rm(ns.args[0])', 'removeFile', ["config.gang.txt"]); await ns.sleep(250); }
			inAGang = await runCom1(ns, 'ns.gang.createGang(ns.args[0])', 'createGang', ["Slum Snakes"]);
            await ns.sleep(250);
        }
		//await setPlayerFocus(ns);
        await ns.sleep(120000);
	}
}

export async function setPlayerFocus(ns) {
    ns.print("Set focus")
    let ownNeuroreceptorManagementImplant = await runCom1(ns, 'ns.singularity.getOwnedAugmentations().includes(ns.args[0])', 'getAugment', ["Neuroreceptor Management Implant"])
    await ns.sleep(250);
	if (ownNeuroreceptorManagementImplant) {
		await runCom1(ns, 'ns.singularity.setFocus(ns.args[0])', 'setFocus', [true]);
        await ns.sleep(250);
	}
}