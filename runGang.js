import {runCom1} from "./functions.js"

/** @param {NS} ns */
export async function main(ns) {
	// Set default ascension ranks of gang members. Members are named 0, 1, 2, etc
	var ascmem = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
	// Relative multiplier for gang member
	let asMult2 = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
	let didasc = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
	if (ns.fileExists("/config.gang.txt", "home")) {
		var data = JSON.parse(ns.read("/config.gang.txt"));
		if (data.length > 0) {
			for (var i = 0; i < data.length; i++) {
				ascmem[i] = data[i].ascmem;
			}
		}
	}
	while (true) {
		// While you can recruit members
		while (await runCom1(ns, 'ns.gang.canRecruitMember()', 'canRecruitMember')) {
			await ns.sleep(200);
			for (let i = 0; i < 30; ++i) {
				//Recruite as many members as possible
				await runCom1(ns, 'ns.gang.recruitMember(ns.args[0])', 'recruitMember', [i]); 
				await ns.sleep(200);
			}
		}
		// Minimum cash that we will have in inventory set to 251m so we can buy all port programs
		let minCashOnHand = 251000000;
		// Get Gang info, cash, equipment, Respect & names
		let myGang = await runCom1(ns, 'ns.gang.getGangInformation()', 'getGangInformation');
		await ns.sleep(200);
		let curCash = await runCom1(ns, 'ns.getServerMoneyAvailable(ns.args[0])', 'getServerMoneyAvailable', ["home"]); 
		await ns.sleep(200);
		let allEquipment = await runCom1(ns, 'ns.gang.getEquipmentNames()', 'getEquipmentNames');
		await ns.sleep(200);
		var curResp = ns.formatNumber(myGang.respect, "0,0.a");
		let members = await runCom1(ns, 'ns.gang.getMemberNames()', 'getMemberNames');
		await ns.sleep(200);
		// Get 'wanted over respect' level 
		var curWant = myGang.wantedLevel;
		var curPena2b = myGang.wantedLevel / myGang.respect * 100;

		// Reset ascension status
		didasc = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
		// Run through ascension for each member
		for (let i = 0; i < members.length; i++) {
			// Get future multiplier if member ascends
			var asMult1 = await runCom1(ns, 'ns.gang.getAscensionResult(ns.args[0]).str', 'getAscensionResult',[i]);
			await ns.sleep(200);
			// If we cannot ascend (mult is null) assign 0 to multiplier otherwise set multiplier to current future multiplier
			asMult2[i] = asMult1;
			// Ascend if multiplier is twice the current multiplier
			if (asMult2[i] >= 2.0) {
				await runCom1(ns, 'ns.gang.ascendMember(ns.args[0])', 'ascendMember', [i]);
				await ns.sleep(200);
				// Record that we ascended this member
				didasc[i] = 1;
				ascmem[i] = ascmem[i] + 1;
			}
		}
		// Run through equipment and set tasks for each member
		for (let i = 0; i < await members.length; i++) {
			// Get member stats
			let memberInfo = ns.gang.getMemberInformation(i);
			// Run through all equipment in the game
			for (var j = 0; j < await allEquipment.length; ++j) {
				var equipment = await allEquipment[j];
				// If member doesn't have equipment and it isn't a hacking tool, buy it
				if (((memberInfo.upgrades.indexOf(equipment) == -1) || (memberInfo.augmentations.indexOf(equipment) == -1)) && equipment != "NUKE Rootkit" && equipment != "Soulstealer Rootkit" && equipment != "Demon Rootkit" && equipment != "Hmap Node" && equipment != "Jack the Ripper" && equipment != "DataJack" && equipment != "Neuralstimulator" && equipment != "BitWire") {
					// If we can afford to buy it then buy it
					var cost = await runCom1(ns, 'ns.gang.getEquipmentCost(ns.args[0])', 'getEquipmentCost', [equipment]);
					await ns.sleep(200);
					if ((await cost + minCashOnHand) < await curCash && await runCom1(ns, 'ns.gang.purchaseEquipment(ns.args[0], ns.args[1])', 'purchaseEquipment', [i, equipment])) {
						await ns.sleep(200);
						curCash = await runCom1(ns, 'ns.getServerMoneyAvailable(ns.args[0])', 'getServerMoneyAvailable', ["home"]); 
						await ns.sleep(200);
					}
				}
			}
			// Get member variables again in case we bought anything
			let memberStr = memberInfo.str; let memberDef = memberInfo.def;
			let memberDex = memberInfo.dex; let memberAgi = memberInfo.agi;
			ns.print(memberStr + " " + memberDef + " " + memberAgi + " " + ascmem[i]);
			// If wanted status is too high then go vigilante to lower it
			if (curResp > 1 && curPena2b > 10 && curWant > 5 && memberStr >= 275) {
				ns.gang.setMemberTask(i, "Vigilante Justice");
			}
			// If stats are too low, train Combat until combat stats are a decent level
			else if ((memberStr <= 935 || memberDef <= 935 || memberAgi <= 935) && ascmem[i] < 5) {
				ns.gang.setMemberTask(i, "Train Combat");
			}
			// If Respect is less than 10 million commit Terrorism
			else if (myGang.respect < 10000000) {
				ns.gang.setMemberTask(i, "Terrorism");
			}
			// Start Territory Warfare if member has ascended twice, needed amount of members reached, 
			// is part of war team (first 6 guys) and territory < 100% conquered (gangtx)
			else if (ascmem[i] > 2 && members.length >= 9 && (i >= 0 && i < 6) && myGang.territory < 1) {
				ns.gang.setMemberTask(i, "Territory Warfare");
				// Check war chances against clans
				const doWar = checkgangwar(ns, 0.80);
				// Set status to whether we do war or not
				ns.gang.setTerritoryWarfare(doWar);
			}
			//If we have enough respect, get money from Traffick Illegal Arms
			else if (myGang.respect > 10000000) {
				ns.gang.setMemberTask(i, "Traffick Illegal Arms");
			}
			// If all else above fails, set the member to Traffick Illegal Arms
			else {
				ns.gang.setMemberTask(i, "Traffick Illegal Arms");
			}
			// Write status to txt file
			var txtstring = "[";
			members = ns.gang.getMemberNames();
			for (let i = 0; i < members.length; ++i) {
				let member = members[i];
				var myGang2 = ns.gang.getMemberInformation(member);
				txtstring = txtstring + '{\"name\":\"' + myGang2.name + '\", ';
				txtstring = txtstring + '\"ascmem\":' + ascmem[i] + '}';
				if (i != members.length - 1) { txtstring = txtstring + ',' }
			}
			txtstring = txtstring + ']';
			ns.write("config.gang.txt", txtstring, "w");
		}
		await ns.sleep(16000);
	}
}
// Check chances of war against other gangs
async function checkgangwar(ns, winchance) {
	// By default we CAN engage in warfare
	var gangResult = true;
	// Get chances to win wars for all other gangs:
	var chantetr = ns.gang.getChanceToWinClash("Tetrads");
	var chansynd = ns.gang.getChanceToWinClash("The Syndicate");
	var chanspea = ns.gang.getChanceToWinClash("Speakers for the Dead");
	var chanblac = ns.gang.getChanceToWinClash("The Black Hand");
	var chandark = ns.gang.getChanceToWinClash("The Dark Army");
	var channite = ns.gang.getChanceToWinClash("NiteSec");
	// Check chances are good for warfare, if not then don't engage 
	if (chantetr < winchance) { gangResult = false; }
	if (chansynd < winchance) { gangResult = false; }
	if (chanspea < winchance) { gangResult = false; }
	if (chanblac < winchance) { gangResult = false; }
	if (chandark < winchance) { gangResult = false; }
	if (channite < winchance) { gangResult = false; }
	// Return the result
	return gangResult;
}