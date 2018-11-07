module.exports = {

	run: function (creep) {
		if (creep._first  ===  undefined) {
			creep._first = true
		} else if (creep._first) {
			creep._first = false
		} else {
			return
		}
		if (creep.memory.gathering && creep.memory.task) {
			if (creep.memory.task == 'source') {
				this.gatherFromSource(creep);
			} else if (creep.memory.task == 'pickup') {
				let target = Game.getObjectById(creep.memory.targetId);
				let err = creep.pickup(target);
				if (err == OK || target == null || target.amount < 100) {
					creep.memory.gathering = false;
				}
				if (err == ERR_NOT_IN_RANGE) {
					creep.moveTo(target)
				}
			} else if (creep.memory.task == 'collectMinerals') {
				let target = creep.room.mineral.container
				let err = creep.withdraw(target, creep.room.mineral.mineralType);
				if (err == OK) {
					creep.memory.gathering = false;
				}
				if (err == ERR_NOT_IN_RANGE) {
					creep.moveTo(target)
				}
			} else if (creep.memory.task == 'deliverToTerminal') {
				let resource;
				if (!creep.memory.targetResource) {
					for (let res in creep.room.memory.desiredTerminalResources) {
						if (creep.room.storage.store[res] > 0 && (res !== RESOURCE_ENERGY || creep.room.storage.store.energy > Empire.MIN_STORAGE_ENERGY)
							&& creep.room.memory.desiredTerminalResources[res] > creep.room.terminal.store[res]) {
							resource = res;
							creep.memory.targetResource = res
							break;
						}
					}
				} else {
					resource = creep.memory.targetResource
				}
				if (!resource) {
					this.doneDelivering(creep)
					return;
				}

				let err = creep.withdraw(creep.room.storage, resource);
				if (err === ERR_NOT_IN_RANGE) {
					creep.moveTo(creep.room.storage);
				} else if (err === ERR_NOT_ENOUGH_RESOURCES) {
					delete creep.memory.targetResource;
				} else if (err != OK) {
					log(`${creep} ${creep.room.name}: err withdrawing ${resource} from storage ${err}`)
				} else {
					creep.memory.gathering = false
				}
			} else if (creep.memory.task === 'takeFromTerminal') {
				let resource;
				if (!creep.memory.targetResource) {
					for (let res in creep.room.terminal.store) {
						if ((!creep.room.memory.desiredTerminalResources && creep.room.terminal.store[res])
							|| (creep.room.memory.desiredTerminalResources && creep.room.terminal.store[res] > creep.room.memory.desiredTerminalResources[res])) {
							resource = res;
							creep.memory.targetResource = res
							break;
						}
					}
				} else {
					resource = creep.memory.targetResource
				}
				if (!resource) {
					this.doneDelivering(creep)
					return;
				}

				let amount = creep.room.terminal.store[resource] - creep.room.memory.desiredTerminalResources[resource]
				let err = creep.withdraw(creep.room.terminal, resource, amount ? amount : undefined);
				if (err === ERR_NOT_IN_RANGE) {
					creep.moveTo(creep.room.storage);
				} else if (err === ERR_NOT_ENOUGH_RESOURCES) {
					delete creep.memory.targetResource;
				} else if (err != OK) {
					log(`${creep} ${creep.room.name}: err withdrawing ${amount} ${resource} from terminal ${err}`)
				} else {
					creep.memory.gathering = false
				}
			} else if (creep.memory.task != 'storage') {
				if (creep.room.storage && creep.room.storage.store.energy > creep.carryCapacity) {
					let err = creep.withdraw(creep.room.storage, RESOURCE_ENERGY);
					if (err == ERR_NOT_IN_RANGE) {
						creep.moveTo(creep.room.storage);
					} else if (err == OK && creep.room.storage.store[RESOURCE_ENERGY] > creep.carryCapacity) {
						creep.memory.gathering = false;
					}
				} else {
					creep.gatherEnergy(creep)
				}
			} else {
				creep.memory.gathering = false
			}
			if (!creep.memory.task || creep.memory.gathering && creep.carry.energy == creep.carryCapacity) {
				creep.memory.gathering = false;
			}
		} else if (!creep.memory.gathering && _.sum(creep.carry) == 0) {
			this.doneDelivering(creep);
			this.getNewTask(creep);
		} else if (creep.makeSureInBossRoom()) {
			// empty
		} else {
			let err;
			let target = Game.getObjectById(creep.memory.target);
			let roadSites = creep.pos.findInRange(FIND_CONSTRUCTION_SITES, 1, {filter: s=>s.structureType == STRUCTURE_ROAD});
			if (roadSites.length > 0) {
				err = creep.build(roadSites[0]);
			}  else if (creep.pos.roomName != creep.memory.bossRoom) {
				if (creep.makeSureInBossRoom) {
					//empty
				} else {
					creep.recycle();
				}
			}

			if (creep.memory.task == 'tower') {
				if (!target || (target.energy && target.energy == target.energyCapacity))  {
					let targets = creep.room.find(FIND_MY_STRUCTURES, {filter: s=> s.structureType == STRUCTURE_TOWER && s.energy < s.energyCapacity});
					if (targets.length > 1) {
						targets.sort((a,b) => a.energy - b.energy);
						target = targets[0];
					} else if (targets.length === 1) {
						target = targets[0];
					}
					if (!target) {
						this.doneDelivering(creep);
					} else {
						creep.memory.target = target.id;
					}
				}
				err = creep.transfer(target, RESOURCE_ENERGY);
				if (err == OK) {
					this.doneDelivering(creep)
				}
			} else if (creep.memory.task == 'spawn') {
				if (!target || (target.energy && target.energy == target.energyCapacity)) {
					target = creep.pos.findClosestByRange(FIND_MY_STRUCTURES, {filter: s=> (s.structureType == STRUCTURE_SPAWN || s.structureType == STRUCTURE_EXTENSION) && s.energy < s.energyCapacity})
					if (!target) {
						this.doneDelivering(creep);
					} else {
						creep.memory.target = target.id;
					}
				}
				if (target) {
					err = creep.transfer(target, RESOURCE_ENERGY);
					if (err == OK && creep.carry.energy == 0) {
						this.doneDelivering(creep);
					}
				}
			} else if (creep.memory.task == 'upgrade') {
				if (!target || (target.energy && target.energy == target.energyCapacity))  {
					target = creep.room.controller.container;
					if (!target) {
						this.doneDelivering(creep);
					} else {
						creep.memory.target = target.id;
					}
				}
				if (target) {
					err = creep.transfer(target, RESOURCE_ENERGY);
					if (err == ERR_NOT_IN_RANGE) {
						creep.moveTo(target);
					} else if (err == OK) {
						this.doneDelivering(creep);
						creep.room.controller.memory.incoming = creep.room.controller.memory.incoming - creep.carryCapacity || 0;
						//log(`${creep.room.controller.memory.incoming} ${creep} ${creep.room} Minus ${-creep.carryCapacity || 0}`)
					} else if (err == ERR_INVALID_TARGET) {
						delete creep.memory.target;
					} else if (err != ERR_FULL) {
						log(`${creep}: weird error while delivering energy to the praise box ${err} ${target} ${target.id}`)
					}
				}
			} else if (creep.memory.task == 'deliverToTerminal') {
				target = creep.room.terminal;
				err = creep.transfer(target, _.findKey(creep.carry));
				if (err == OK) {
					this.doneDelivering(creep);
					delete creep.memory.targetResource;
				}
			} else if (creep.memory.task == 'takeFromTerminal') {
				target = creep.room.storage;
				err = creep.transfer(target, _.findKey(creep.carry));
				if (err == OK) {
					this.doneDelivering(creep);
					delete creep.memory.targetResource;
				}
			} else if (creep.memory.task == 'storage' && ((creep.room.storage && creep.room.storage.isActive()) || creep.room.container)) {
				target = creep.room.storage ? creep.room.storage : creep.room.container;
				err = creep.transfer(target, RESOURCE_ENERGY);
				if (err == OK || err == ERR_FULL) {
					this.doneDelivering(creep);
				}
			} else if (creep.memory.task == 'praise') {
				target = creep.room.controller;
				err = creep.transfer(target, RESOURCE_ENERGY);
				if (err == OK && creep.carry.energy == 0) {
					this.doneDelivering(creep);
				}
			} else if (creep.memory.task == 'collectMinerals') {
				target = creep.room.storage;
				err = creep.transfer(target, _.findKey(creep.carry))
				if (err == OK) {
					this.doneDelivering(creep);
				}
			} else {
				this.doneDelivering(creep);
				this.getNewTask(creep);
			}
			if (err == ERR_NOT_IN_RANGE) {
				creep.moveTo(target, {range:1});
			}
		}
		this.repairRoads(creep)
		if (Memory.visuals.displayTasks) {
			let text = creep.memory.task || 'idle';
			creep.room.visual.text(text, creep.pos);
		}
	},
	repairRoads: function(creep) {
		if (creep.carry.energy > 0) {
			let road = creep.pos.lookFor(LOOK_STRUCTURES);
			if (road.length>0) {
				if (road[0].hits<road[0].hitsMax) {
					creep.repair(road[0]);
				}
			}
		}
	},
	doneDelivering: function(creep) {
		creep.memory.gathering = true;
		creep.memory.sourceId = null;
		delete creep.memory.task;
		delete creep.memory.target;
	},
	getNewTask: function(creep) {
		this.decideTowers(creep);
		this.decidePraise(creep);
		this.decideSpawn(creep);
		this.decideMinerals(creep);
		this.decideStorage(creep);
		this.decideTakeTerminal(creep);
		this.decideTerminal(creep);
		this.decidePickup(creep);
		this.decideDeliverPraise(creep);

		if (!creep.memory.task) {
			creep.memory.task = 'source';
		}

		if (creep.memory.task) {
			creep.memory.gathering = !(creep.memory.job == 'storage') && (creep.carry.energy < creep.carryCapacity);
			creep.memory.taskAssignedTime = Game.time
			creep.say(creep.memory.task)
			this.run(creep)
		}
	},

	decideTowers: function(creep) {
		if (creep.room.find(FIND_MY_STRUCTURES, {filter: s=> s.structureType == STRUCTURE_TOWER && s.energy < s.energyCapacity}).length > 0
			&& !creep.room.find(FIND_MY_CREEPS, {filter: c=> c.memory.task === 'tower'}).length) {
			creep.memory.task = 'tower'
		}
	},

	decidePraise: function(creep) {
		if (!creep.memory.task && ((creep.room.controller.ticksToDowngrade < CONTROLLER_DOWNGRADE[creep.room.controller.level]/2 )
		|| (creep.room.controller.progress > creep.room.controller.progressTotal || creep.room.controller.level < 2))) {
			creep.memory.task = 'praise'
			creep.memory.lastTaskId = creep.room.controller.id;
		}
	},

	decideSpawn: function(creep) {
		if (!creep.memory.task && !creep.room.find(FIND_MY_CREEPS, {filter: c=>c.memory.role == 'spawnHelper'}).length) {
			let totalSpawn = 0;
			for (let c of _.filter(Game.creeps, c=>c.memory.task && c.memory.task == 'spawn' && c.memory.bossRoom == creep.room.name)) {
				totalSpawn += c.carry.energy;
			}
			let desired = creep.room.energyCapacityAvailable - creep.room.energyAvailable
			if (totalSpawn < desired) {
				creep.memory.task = 'spawn';
				creep.memory.lastTaskId = creep.room.storage.id;
			}
			//log(`Hauling choice: ${totalSpawn} / ${desired}. Upgrade: ${totalUpgrade} - ${upgradeParts*distance}(${upgradeParts}*${distance})`);
		}
	},

	decideMinerals: function(creep) {
		if (!creep.memory.task && creep.room.storage && _.sum(creep.carry) == 0) {
			let container = creep.room.mineral.container
			if (container) {
				let minerals = _.sum(container.store)
				for (let c of _.filter(Game.creeps, c=>c.memory.task && c.memory.task == 'collectMinerals' && c.memory.bossRoom == creep.room.name && c.memory.gathering)) {
					minerals += _.sum(c.carry) - creep.carryCapacity;
				}
				let upgradeParts = 0;
				for (let c of creep.room.find(FIND_MY_CREEPS, {filter: c=>c.memory.role == 'miner'})) {
					upgradeParts += c.getActiveBodyparts(WORK);
				}
				let distance = this.getDistance(creep, container)
				let metric = minerals + upgradeParts*distance/5;
				if (distance*2 < creep.ticksToLive && (metric > creep.carryCapacity || metric > 1900)) {
					creep.memory.task = 'collectMinerals';
					creep.memory.lastTaskId = creep.room.storage.id;
				}
			}
		}
	},

	decideDeliverPraise: function(creep) {
		if (!creep.memory.task) {
			let upgradeContainer = creep.room.controller.container;
			if (upgradeContainer) {
				let totalUpgrade = upgradeContainer.store[RESOURCE_ENERGY];
				totalUpgrade += creep.room.controller.memory.incoming || 0;
				let distance = this.getDistance(creep, upgradeContainer)
				let metric = upgradeContainer.storeCapacity - (totalUpgrade - (creep.room.controller.memory.rate || 1)*distance);
				if (distance*2 < creep.ticksToLive && metric > creep.carryCapacity && ((!creep.room.storage && creep.room.container) || (creep.room.storage && creep.room.storage.store[RESOURCE_ENERGY] > Empire.MIN_STORAGE_ENERGY))) {
					creep.memory.task = 'upgrade';
					creep.memory.lastTaskId = upgradeContainer.id;
					creep.room.controller.memory.incoming = creep.room.controller.memory.incoming + creep.carryCapacity || creep.carryCapacity;
					//log(`${creep.room.controller.memory.incoming} ${creep} ${creep.room} Add ${creep.carryCapacity || creep.carryCapacity}`)
				}
			}
		}
	},

	decideStorage: function(creep) {
		if (!creep.memory.task && (creep.room.storage || creep.room.container) && creep.carry.energy > 0) {
			creep.memory.task = 'storage'
			creep.memory.lastTaskId = creep.room.storage ? creep.room.storage.id : creep.room.container.id;
		}
	},

	decideTerminal: function(creep) {
		if (!creep.memory.task && creep.room.storage && creep.room.terminal && creep.room.memory.desiredTerminalResources) {
			for (let res in creep.room.memory.desiredTerminalResources) {
				//log(res, creep.room.memory.desiredTerminalResources[res], creep.room.terminal.store[res], creep.room.storage.store[res])
				if (creep.room.storage.store[res] > 0 && ((res === RESOURCE_ENERGY && creep.room.storage.store.energy > 40000) || res !== RESOURCE_ENERGY)
				&& (!creep.room.terminal.store[res] || creep.room.memory.desiredTerminalResources[res] > creep.room.terminal.store[res])) {
					creep.memory.task = 'deliverToTerminal';
					creep.memory.lastTaskId = creep.room.terminal.id;
					break;
				}
			}
		}
	},

	decidePickup: function(creep) {
		if (!creep.memory.task && creep.carry.energy < creep.carryCapacity) {
			let pickups = creep.pos.findInRange(FIND_DROPPED_RESOURCES, 5);
			if (pickups.length > 0) {
				for (let pickup of pickups) {
					if (pickup.amount > 100) {
						creep.memory.targetId = pickup.id;
						creep.memory.task = 'pickup';
						break;
					}
				}
			}
		}
	},

	decideTakeTerminal: function(creep) {
		if (!creep.memory.task && creep.room.storage && creep.room.terminal) {
			for (let res in creep.room.terminal.store) {
				//log(res, creep.room.memory.desiredTerminalResources[res], creep.room.terminal.store[res], creep.room.storage.store[res])
				if ((!creep.room.memory.desiredTerminalResources && creep.room.terminal.store[res])
					|| (creep.room.memory.desiredTerminalResources && creep.room.terminal.store[res] > creep.room.memory.desiredTerminalResources[res])) {
					creep.memory.task = 'takeFromTerminal';
					creep.memory.lastTaskId = creep.room.storage.id;
					break;
				}
			}
		}
	},

	getDistance: function(creep, target) {
		if (creep.memory.lastTaskId) {
			return Empire.getPathCost(creep.memory.lastTaskId, target.id)
		} else {
			return creep.pos.findPathTo(target).length;
		}
	},
	gatherFromSource: function(creep) {
		if (creep.memory.sourceId) {
			let source = Game.getObjectById(creep.memory.sourceId);
			if (source) {
				if (source.room.name in Memory.dangerRooms) {
					this.doneDelivering(creep);
					return;
				}
				let target;
				var err;
				let withdrawAmount = 0;
				let droppedEnergy;
				//if (source.container) {
					//droppedEnergy = source.container.pos.lookFor(LOOK_RESOURCES);
				//} else {
					droppedEnergy = source.pos.findInRange(FIND_DROPPED_RESOURCES, 1);
				//}
				if (droppedEnergy.length) {
					droppedEnergy = droppedEnergy[0]
				}
				if (droppedEnergy instanceof Resource) {
					target = droppedEnergy;
					err = creep.pickup(target);
					if (err == OK && creep.carryCapacity - creep.carry.energy < target.amount) {
						creep.memory.gathering = false;
					} else {
						withdrawAmount = creep.carryCapacity - creep.carry.energy - target.amount
					}
				} else {
					withdrawAmount = null;
				}

				if (creep.memory.gathering && err != ERR_NOT_IN_RANGE) {
					if (source.container) {
						target = source.container;
						if (creep.carryCapacity - creep.carry.energy <= target.store[RESOURCE_ENERGY] + withdrawAmount) {
							if (withdrawAmount) {
								err = creep.withdraw(target, RESOURCE_ENERGY, withdrawAmount);
							} else {
								err = creep.withdraw(target, RESOURCE_ENERGY);
							}
						}
						if (err == OK) {
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
			for (let r of Game.rooms[creep.memory.bossRoom].getRoomNames()) {
				if (Game.rooms[r] && !(r in Memory.dangerRooms)) {
					for (let source of Game.rooms[r].find(FIND_SOURCES)) {
						let distance = this.getDistance(creep, source)
						let energy = 0;
						for (let creep of _.filter(Game.creeps, c=>c.memory.sourceId == source.id && c.memory.gathering)) {
							energy -= creep.carryCapacity - creep.carry.energy;
						}
						if (source.container) {
							energy += source.container.store[RESOURCE_ENERGY];
						}
						for (let r of source.pos.findInRange(FIND_DROPPED_RESOURCES, 1, {filter: r=>r.resourceType == RESOURCE_ENERGY})) {
							energy += r.amount;
						}
						let reserved = energy;
						if (source.pos.findInRange(FIND_MY_CREEPS, 1, {filter: c=>c.memory.role == 'miner'}).length > 0) {
							energy += distance*6;
						}
						if (distance*2 < creep.ticksToLive) {
							possibleSources.push({id:source.id, distance:distance, energy:energy, r:reserved});
						}
					}
				}
			}
			if (possibleSources.length) {
				let best = possibleSources[0];
				for (let i in possibleSources) {
					let {id, distance, energy} = possibleSources[i];
					if ((energy >= creep.carryCapacity && best.distance > distance) || best.energy < creep.carryCapacity) {
						best = possibleSources[i];
					}
				}
				if (best.energy >= creep.carryCapacity) {
					//log(JSON.stringify(best), Game.time);
					creep.memory.sourceId = best.id;
					creep.memory.lastTaskId = best.id;
				}
			}
		}
		if (!creep.memory.sourceId && (Game.time - creep.memory.taskAssignedTime) >= 10) {
			this.doneDelivering(creep)
			this.getNewTask(creep)
		}
	},
	death: function(creep) {
		if (creep.memory.task == 'upgrade') {
			Game.rooms[creep.memory.bossRoom].controller.memory.incoming -= creep.carryCapacity;
			//log(`${creep.room.controller.memory.incoming} ${creep} ${creep.room} Minus ${-creep.carryCapacity || 0}`)
		}
	}
};
