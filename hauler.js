var gatherEnergy = require("creepGatherEnergy");
module.exports = {

	run: function (creep) {
		if (creep.memory.gathering) {
			if (creep.memory.job == 'source') {
				this.gatherFromSource(creep);
			} else if (creep.room.storage && (creep.memory.job == 'upgrade' || creep.memory.job == 'spawn' || creep.memory.job == 'deliverEnergyToTerminal')) {
				let err = creep.withdraw(creep.room.storage, RESOURCE_ENERGY);
				if (err == ERR_NOT_IN_RANGE) {
					creep.moveTo(creep.room.storage);
				} else if (err == OK && creep.room.storage.store[RESOURCE_ENERGY] > creep.carryCapacity) {
					creep.memory.gathering = false;
				}
			} else if (creep.memory.job == 'pickup') {
				let target = Game.getObjectById(creep.memory.targetId);
				let err = creep.pickup(target);
				if (err == OK || target == null || target.amount < 100) {
					creep.memory.gathering = false;
				}
				if (err == ERR_NOT_IN_RANGE) {
					creep.moveTo(target)
				}
			}
			if (!creep.memory.job || creep.memory.gathering && creep.carry.energy == creep.carryCapacity) {
				creep.memory.gathering = false;
			}
		} else if (!creep.memory.gathering && creep.carry.energy == 0) {
			this.doneDelivering(creep);
			this.getNewJob(creep);
		} else {
			let err;
			let target;
			let roadSites = creep.pos.findInRange(FIND_CONSTRUCTION_SITES, 1, {filter: s=>s.structureType == STRUCTURE_ROAD});
			if (roadSites.length > 0) {
				err = creep.build(roadSites[0]);
			}  else if (creep.pos.roomName != creep.memory.bossRoom) {
				if (creep.memory.bossRoom) {
					creep.moveTo(new RoomPosition(25,25,creep.memory.bossRoom), {range:22});
				} else {
				    creep.memory.role = 'recycle';
				}
			}

			if (target = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {filter: s=> s.structureType == STRUCTURE_TOWER && s.energy < s.energyCapacity})) {
				err = creep.transfer(target, RESOURCE_ENERGY);
			} else if (creep.memory.job == 'spawn') {
				target = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {range:1, filter: s=> (s.structureType == STRUCTURE_SPAWN || s.structureType == STRUCTURE_EXTENSION) && s.energy < s.energyCapacity})
				if (target) {
					err = creep.transfer(target, RESOURCE_ENERGY);
				} else {
					creep.memory.job = 'storage';
				}
				if (err == OK && creep.carry.energy == 0) {
					this.doneDelivering(creep);
				}
			} else if (creep.memory.job == 'upgrade') {
				target = creep.room.controller.pos.findInRange(FIND_STRUCTURES, 2, {filter: s=>s.structureType == STRUCTURE_CONTAINER});
	            if (target.length > 0) {
	                err = creep.transfer(target[0], RESOURCE_ENERGY);
	                if (err == ERR_NOT_IN_RANGE) {
	                    creep.moveTo(target[0]);
	                }
					if (err == OK) {
						this.doneDelivering(creep);
					}
	            }
			} else if (creep.memory.job == 'deliverEnergyToTerminal') {
				target = creep.room.terminal;
				err = creep.transfer(target, RESOURCE_ENERGY);
				if (err == OK) {
					this.doneDelivering(creep);
				}
			} else if (creep.room.storage) {
			    target = creep.room.storage;
				err = creep.transfer(target, RESOURCE_ENERGY);
				if (err == OK) {
					this.doneDelivering(creep);
				}
			}
			if (err == ERR_NOT_IN_RANGE) {
				creep.moveTo(target, {range:1});
			}
			if (creep.carry.energy > 0 && creep.pos.lookFor(LOOK_STRUCTURES).length > 0) {
			 	creep.repair(creep.pos.lookFor(LOOK_STRUCTURES)[0]);
			}
		}
		if (Memory.visuals.displayJobs) {
			let text = creep.memory.job || 'idle';
			creep.room.visual.text(text, creep.pos);
		}
	},
	doneDelivering: function(creep) {
		creep.memory.gathering = true;
		creep.memory.sourceId = null;
		delete creep.memory.job;
	},
	getNewJob: function(creep) {
		if (creep.room.storage && creep.room.storage.store[RESOURCE_ENERGY] > 10000 && creep.room.terminal && creep.room.terminal.store[RESOURCE_ENERGY] < 10000) {
			creep.memory.job = 'deliverEnergyToTerminal';
		}

		if (!creep.memory.job) {
			let upgradeContainer = creep.room.controller.pos.findClosestByRange(FIND_STRUCTURES, {filter: s=>s.structureType == STRUCTURE_CONTAINER});
			if (upgradeContainer) {
				let totalUpgrade = upgradeContainer.store[RESOURCE_ENERGY];
				for (let c of _.filter(Game.creeps, c=>c.memory.job && c.memory.job == 'upgrade')) {
					totalUpgrade += c.carry.energy;
				}
				let upgradeParts = 0;
				for (let c of creep.room.find(FIND_MY_CREEPS, {filter: c=>c.memory.role == 'stationaryUpgrader'})) {
					upgradeParts += c.getActiveBodyparts(WORK);
				}
				let distance = creep.pos.findPathTo(upgradeContainer).length;
				if (upgradeContainer.storeCapacity - (totalUpgrade - upgradeParts*distance) < creep.carryCapacity && (!creep.room.storage || (creep.room.storage && creep.room.storage.store[RESOURCE_ENERGY] > 50000))) {
					creep.memory.job = 'upgrade';
				}
			}
		}

		if (!creep.memory.job) {
			let totalSpawn = 0;
			for (let c of _.filter(Game.creeps, c=>c.memory.job && c.memory.job == 'spawn')) {
				totalSpawn += c.carry.energy;
			}
			let desired = 0;
			for (let structure of creep.room.find(FIND_MY_STRUCTURES, {filter: s => s.structureType == STRUCTURE_SPAWN || s.structureType == STRUCTURE_EXTENSION})) {
				desired += structure.energyCapacity - structure.energy;
			}
			if (totalSpawn < desired) {
				creep.memory.job = 'spawn';
			}
			//console.log(`Hauling choice: ${totalSpawn} / ${desired}. Upgrade: ${totalUpgrade} - ${upgradeParts*distance}(${upgradeParts}*${distance})`);
		}
		if (!creep.memory.job) {
			let pickups = creep.pos.findInRange(FIND_DROPPED_RESOURCES, 5, {filter: r => r.resourceType == RESOURCE_ENERGY});
			if (pickups.length > 0) {
				for (let pickup of pickups) {
					if (pickup.amount > 100) {
						creep.memory.targetId = pickup.id;
						creep.memory.job = 'pickup';
					}
				}
			}
		}
		if (!creep.memory.job) {
			creep.memory.job = 'source';
		}
		if (creep.memory.job) {
			creep.memory.gathering = true;
		}
	},
	gatherFromSource: function(creep) {
		if (creep.memory.sourceId) {
			let source = Game.getObjectById(creep.memory.sourceId);
			if (source) {
				let target;
				let containers = source.pos.findInRange(FIND_STRUCTURES, 2, {filter: s=>s.structureType == STRUCTURE_CONTAINER && s.store[RESOURCE_ENERGY] > 0});
				var err;
				if (containers.length > 0) {
					target = containers[0];
					err = creep.withdraw(target, RESOURCE_ENERGY);
					if (err == OK && creep.carryCapacity - creep.carry.energy < target.store[RESOURCE_ENERGY]) {
						creep.memory.gathering = false;
					}
				} else {
					let droppedEnergy = source.pos.findInRange(FIND_DROPPED_RESOURCES, 1, {filter: r=>r.resourceType == RESOURCE_ENERGY});
					if (droppedEnergy.length > 0) {
						target = droppedEnergy[0];
						err = creep.pickup(target);
						if (err == OK && creep.carryCapacity - creep.carry.energy < target.amount) {
							creep.memory.gathering = false;
						}
					}
				}
				if (!target) {
					creep.moveTo(source, {range:2});
				} else if (err == ERR_NOT_IN_RANGE) {
					creep.moveTo(target, {range:1});
				}
				if (creep.carry.energy == creep.carryCapacity) {
					creep.memory.gathering = false;
				}
			}
		} else {
			let possibleSources = [];
			for (let room in Memory.ownedRooms) {
				for (let r of Memory.ownedRooms[room]) {
					if (Game.rooms[r] && room == creep.memory.bossRoom) {
						for (let source of Game.rooms[r].find(FIND_SOURCES)) {
							let path = PathFinder.search(creep.pos, {pos:source.pos, range:2}, {roomCallBack:global.costMatrixCallback, swamp:10, plains:2});
							if (path.incomplete) {
								console.log(`Incomplete path: ${creep.pos} ${soucre.pos}`);
							}
							let distance = path.cost/2;
							let energy = 0;
							for (let creep of _.filter(Game.creeps, c=>c.memory.sourceId == source.id && c.memory.gathering)) {
								energy -= creep.carryCapacity + creep.carry.energy;
							}
							for (let s of source.pos.findInRange(FIND_STRUCTURES, 1, {filter: s=>s.structureType == STRUCTURE_CONTAINER})) {
								energy += s.store[RESOURCE_ENERGY];
							}
							for (let r of source.pos.findInRange(FIND_DROPPED_RESOURCES, 1, {filter: r=>r.resourceType == RESOURCE_ENERGY})) {
								energy += r.amount;
							}
							let reserved = energy;
							if (source.pos.findInRange(FIND_MY_CREEPS, 1, {filter: c=>c.memory.role == 'miner'}).length > 0) {
								energy += distance*6;
							}
							possibleSources.push({id:source.id, distance:distance, energy:energy, r:reserved});
						}
					}
				}
			}
			let best = possibleSources[0];
			for (let i in possibleSources) {
				let {id, distance, energy} = possibleSources[i];
				if ((energy >= creep.carryCapacity && best.distance > distance) || best.energy < creep.carryCapacity) {
					best = possibleSources[i];
				}
			}
			if (best.energy >= 0) {
				//console.log(JSON.stringify(best), Game.time);
				creep.memory.sourceId = best.id;
			}
		}
	}
};
