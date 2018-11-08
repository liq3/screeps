const spawnManager = require('spawnManager');

module.exports = {
	run: function(room) {
		if (Empire.deadCreeps.length) {
			let done = []
			for (let name of Empire.deadCreeps) {
				let tombstone = room.find(FIND_TOMBSTONES, {filter: t=>t.creep.name === name})
				if (tombstone.length) {
					creepFunctions[Memory.creeps[name].role].death(tombstone[0].creep);
					delete Memory.creeps[name];
					done.push(name)
				}
			}
			for (let name of done) {
				Empire.deadCreeps.splice(Empire.deadCreeps.indexOf(name), 1)
			}
		}

		if (room.controller && !room.controller.my) {
			let danger = false;
			let hostileCreeps = room.find(FIND_HOSTILE_CREEPS);
			for (let creep of hostileCreeps) {
				if (creep.getActiveBodyparts(ATTACK) > 0 || creep.getActiveBodyparts(RANGED_ATTACK) > 0) {
					danger = true;
					break;
				}
			}
			if (danger && !Memory.dangerRooms.includes(room.name)) {
				log(room + " is dangerous!"),
				Memory.dangerRooms.push(room.name);
			} else if (!danger && Memory.dangerRooms.includes(room.name)){
				Memory.dangerRooms.splice(Memory.dangerRooms.indexOf(room.name), 1);
			}
		}

		for (let source of room.find(FIND_SOURCES)) {
			if (source.link && room.controller.link && source.link.cooldown === 0 && source.link.energy > 400
					&& source.link.energy <= room.controller.link.energyCapacity - room.controller.link.energy) {
				source.link.transferEnergy(room.controller.link)
			}
		}

		if (room.controller && room.controller.my && Game.cpu.bucket > 7000
		&& room.find(FIND_MY_STRUCTURES, {filter: s => s.structureType === STRUCTURE_SPAWN && !s.spawning})[0] != undefined) {
			spawnManager.spawnCreepsTest(room);
		}

		if (room.memory.plannedRoads && room.memory.plannedRoads.length && _.size(Game.constructionSites) < 20) {
			for (let i = 0; i < 5; i++) {
				let {x,y,type} = room.memory.plannedRoads.pop()
				if (!_.any(room.lookForAt( FIND_STRUCTURES, x,y), {stuctureType:STRUCTURE_RAMPART})) {
					room.createConstructionSite(x,y,type)
				}
				if (!room.memory.plannedRoads.length) {
					break;
				}
			}
		}

		if (Game.cpu.bucket > 8000 && room.terminal && !room.terminal.cooldown) {
			for (const resource of [RESOURCE_HYDROGEN, RESOURCE_OXYGEN]) {
				let minRes = room.memory.minResources && room.memory.minResources[resource] || 0
				if (room.terminal.store[resource] > 1000 + minRes && room.terminal.store[RESOURCE_ENERGY] > 1000) {
					let maxResources = room.terminal.store[resource] - minRes
					if (maxResources <= 0) {
						continue;
					}
					let orders = Game.market.getAllOrders({type:ORDER_BUY, resourceType:resource, price:1})
					orders.sort((a,b) => Game.market.calcTransactionCost(1000, room.name, a.roomName) - Game.market.calcTransactionCost(1000, room.name, b.roomName));
					for (let order of orders) {
						let amount = _.min([maxResources, order.amount])
						let cost = Game.market.calcTransactionCost(amount, room.name, order.roomName)
						if (cost < room.terminal.store.energy && amount > 0) {
							let err = Game.market.deal(order.id, amount, room.name)
							log(`Deal: ${err}. ${amount} ${order.resourceType} for ${order.price} total ${amount*order.price}`);
							maxResources -= amount
						}
					}
				} else if ((room.terminal.store[resource] || 0) + (room.storage.store[resource] || 0) < minRes
							&& room.memory.buy && room.memory.buy[resource] && room.memory.buy[resource].amount > 0) {
					let maxResources = Math.min(minRes - ((room.terminal.store[resource] || 0) + (room.storage.store[resource] || 0)), room.memory.buy[resource].amount)
					if (maxResources <= 0) {
						continue;
					}
					let orders = Game.market.getAllOrders(o => o.type === ORDER_SELL && o.resourceType === resource && o.price < room.memory.buy[resource].price)
					orders.sort((a,b) => Game.market.calcTransactionCost(1000, room.name, a.roomName) - Game.market.calcTransactionCost(1000, room.name, b.roomName));
					for (let order of orders) {
						let amount = _.min([maxResources, order.amount])
						let cost = Game.market.calcTransactionCost(amount, room.name, order.roomName)
						if (cost < room.terminal.store.energy && amount > 0) {
							let err = Game.market.deal(order.id, amount, room.name)
							log(`Deal: ${err}. ${amount} ${order.resourceType} for ${order.price} total ${amount*order.price}`);
							maxResources -= amount
						}
					}
				}
			}
		}
	}
};
