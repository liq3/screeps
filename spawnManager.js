module.exports = {
    spawnCreeps: function(spawn) {
        function sumCreeps(role, room) {
            if (room == undefined) {
                return _.sum(Game.creeps, c => c.memory.role == role);
            } else {
                return room.find(FIND_MY_CREEPS, {filter: c=> c.memory.role == role}).length;
            }
        }

        let scoutTarget = null;
        let minerTargetId = null;
        let spawnHauler = false;
        let sourceList = [];
        for (let r of Memory.ownedRooms[spawn.room.name]) {
            if (Game.rooms[r] == null && scoutTarget == null
                    && _.filter(Game.creeps, c => c.memory.role == 'scout' && c.memory.targetPos.roomName == r).length == 0) {
                scoutTarget = r;
            } else if (Game.rooms[r]) {
                for (let source of Game.rooms[r].find(FIND_SOURCES)) {
                    let path = PathFinder.search(spawn.pos, {pos:source.pos, range: 2}, {roomCallBack:global.costMatrixCallback, swamp:10, plains:2});
                    sourceList.push({source:source, path:path});
                }
            }
        }

        sourceList.sort((a,b) => a.path.cost - b.path.cost );
        let desiredTransportCapacity = 0;
        for (let {source,path} of sourceList) {
            let miners = _.filter(Game.creeps, c => c.memory.sourceId == source.id && c.memory.role == 'miner');
            if (minerTargetId == null && (miners.length == 0 || (miners.length == 1 && miners[0].ticksToLive < ((path.cost+11)*3)))) {
                minerTargetId = source.id;
            } else if (miners.length > 0) {
                desiredTransportCapacity += Math.ceil( 4 * path.cost * source.energyCapacity / ENERGY_REGEN_TIME);
            }
        }
        let transportCapacity = 0;
        for (let creep of _.filter(Game.creeps, c => c.memory.role == 'hauler' && c.memory.bossRoom == spawn.room.name)) {
            transportCapacity += creep.carryCapacity;
        }
        if (transportCapacity < desiredTransportCapacity) {
            spawnHauler = true;
        }

        let reserveTargetRoom = null;
        for (let r of Memory.ownedRooms[spawn.room.name]) {
            if (Game.rooms[r] && !Game.rooms[r].controller.my) {
                let a = _.filter(Game.creeps, c => c.memory.role == 'claimer' && c.memory.targetRoom == r).length;
                if (a < 1 || (a < 2 && Game.rooms[r].controller.reservation && Game.rooms[r].controller.reservation.ticksToEnd < 4500)) {
                    reserveTargetRoom = r;
                    break;
                }
            }
        }

        searchRooms = [];
        searchRooms = _.filter(Game.flags, f => f.name == 'claim');
        for (let i in searchRooms) {
            searchRooms[i] = searchRooms[i].pos.roomName;
        }
        let claimTargetRoom = null;
        for (let r of searchRooms) {
            let trans = _.filter(Game.creeps, c => c.memory.claimRoom == r && c.memory.role == 'claimer').length;
            if (trans == 0) {
                claimTargetRoom = r;
                break;
            }
        }

        searchRooms = [];
        searchRooms = _.filter(Game.flags, f => f.name.split(" ")[0] == 'attack');
        for (let i in searchRooms) {
            searchRooms[i] = searchRooms[i].pos.roomName;
        }
        let spawnAttacker = false;
        let attackerTargetRoom = null;
        for (let r of searchRooms) {
            let attackers = _.filter(Game.creeps, c => c.memory.targetRoom == r && c.memory.role == 'attacker').length;
            if (attackers == 0) {
                spawnAttacker = true;
                attackerTargetRoom = r;
                break;
            }
        }

        searchRooms = [];
        searchRooms = _.filter(Game.flags, f => f.name.split(" ")[0] == 'harass');
        for (let i in searchRooms) {
            searchRooms[i] = searchRooms[i].pos.roomName;
        }
        let attackerParts;
        for (let r of searchRooms) {
            let attackers = _.filter(Game.creeps, c => c.memory.targetRoom == r && c.memory.role == 'attacker').length;
            if (attackers == 0) {
                spawnAttacker = true;
                attackerTargetRoom = r;
                attackerParts = 1;
                break;
            }
        }

        let spawnAttackerRanged = false;
        let attackerRangedTargetRoom;
        searchRooms = [];
        searchRooms = _.filter(Game.flags, f => f.name.split(" ")[0] == 'attackRanged');
        for (let i in searchRooms) {
            searchRooms[i] = searchRooms[i].pos.roomName;
        }
        for (let r of searchRooms) {
            let attackers = _.filter(Game.creeps, c => c.memory.targetRoom == r && c.memory.role == 'attackerRanged').length;
            if (attackers == 0) {
                spawnAttackerRanged = true;
                attackerRangedTargetRoom = r;
                break;
            }
        }

        searchRooms = [];
        searchRooms = _.filter(Game.flags, f => f.name.split(" ")[0] == 'decoy');
        for (let i in searchRooms) {
            searchRooms[i] = searchRooms[i].pos.roomName;
        }
        let decoyTargetRoom;
        for (let r of searchRooms) {
            decoyTargetRoom = r;
            break;
        }

        let upgradeWorkParts = 0;
        for (let creep of spawn.room.find(FIND_MY_CREEPS, {filter: c=> c.memory.role == 'stationaryUpgrader'})) {
            for (let part in creep.body) {
                if (creep.body[part].type == WORK) {
                    upgradeWorkParts += 1;
                }
            }
        }
        let upgradeContainer = spawn.room.controller.pos.findClosestByRange(FIND_STRUCTURES, {filter: s => s.structureType == STRUCTURE_CONTAINER});
        let upgradeHaulerDistance = PathFinder.search(spawn.room.storage.pos, {pos:upgradeContainer.pos, range:0}).cost * 2;
        let desiredUpgradeHaulerCapacity = upgradeHaulerDistance * upgradeWorkParts;
        let currentUpgradeHaulerCapacity = 0;
        for (let creep of spawn.room.find(FIND_MY_CREEPS, {filter: c=> c.memory.role == 'upgradeHauler'})) {
            for (let part in creep.body) {
                if (creep.body[part].type == CARRY) {
                    currentUpgradeHaulerCapacity += 50;
                }
            }
        }
        let upgradeHaulerParts;
        if (desiredUpgradeHaulerCapacity > currentUpgradeHaulerCapacity) {
            for (let creep of spawn.room.find(FIND_MY_CREEPS, {filter: c=> c.memory.role == 'upgradeHauler'})) {
                creep.memory.role = 'recycle';
            }
            upgradeHaulerParts = Math.ceil(desiredUpgradeHaulerCapacity / 100);
        }

        var RCL = spawn.room.controller.level;
        let numberHarvesters = sumCreeps('harvester', spawn.room);
        let numberBuilders = sumCreeps ('builder', spawn.room);
        let numberStationaryUpgraders = sumCreeps('stationaryUpgrader', spawn.room);
        let numberSpawnHelpers = sumCreeps('spawnHelper', spawn.room);
        let numberGuards = sumCreeps('guard');

        if (numberHarvesters < 5 && (sumCreeps('miner', spawn.room) == 0 || _.filter(Game.creeps, c=>c.memory.role=='hauler' && c.memory.bossRoom==spawn.room.name).length == 0)) {
            this.createCreep(spawn, 'Harvester ', {role:'harvester'});
        } else if (spawnAttacker) {
            this.createCreep(spawn, 'A', {role:'attacker',targetRoom:attackerTargetRoom}, attackerParts);
        } else if (spawnAttackerRanged) {
            this.createCreep(spawn, 'AR', {role:'attackerRanged',targetRoom:attackerRangedTargetRoom});
        } else if (scoutTarget) {
            this.createCreep(spawn, 'S', {role:'scout', targetPos:{x:25,y:25,roomName:scoutTarget}})
        } else if (claimTargetRoom) {
            this.createCreep(spawn, "CLAIM THE ROOM", {role: 'claimer', claimRoom:claimTargetRoom});
        } else if (numberBuilders < 1 && RCL > 2) {
            this.createCreep(spawn, 'B', {role:'builder'});
        } else if (spawnHauler && RCL >= 3) {
            this.createCreep(spawn, 'H', {role:'hauler', bossRoom:spawn.room.name});
        } else if (minerTargetId && RCL > 2) {
            this.createCreep(spawn, 'M', {role:'miner',sourceId:minerTargetId});
        } else if (numberGuards < 1) {
            this.createCreep(spawn, 'G', {role:'guard'});
        } else if (false && numberSpawnHelpers < 1 && spawn.room.storage && spawn.room.storage.store[RESOURCE_ENERGY] > 5000) {
            this.createCreep(spawn, 'SH', {role:'spawnHelper'});
        } else if (reserveTargetRoom && RCL > 2) {
            this.createCreep(spawn, 'C', {role:'claimer', targetRoom: reserveTargetRoom});
        } else if (decoyTargetRoom) {
            this.createCreep(spawn, 'D', {role:'decoy', targetRoom:decoyTargetRoom});
        } else if ((numberStationaryUpgraders < 3 && spawn.room.storage && numberStationaryUpgraders < Math.ceil(spawn.room.storage.store[RESOURCE_ENERGY] / 50000)) || (spawn.room.storage == undefined && numberStationaryUpgraders < 3)) {
            this.createCreep(spawn, 'SU', {role:'stationaryUpgrader'});
        } else if (false && upgradeHaulerParts) {
            this.createCreep(spawn, 'UH', {role:'upgradeHauler'}, upgradeHaulerParts);
        }
    },

    createCreep: function(spawn, name, data, partNumber) {
        let parts = [];
        if (data.role == 'miner') {
            let numberParts = Math.floor((spawn.room.energyCapacityAvailable - 150) / 100);
            parts = Array(Math.min(6,numberParts)).fill(WORK);
            parts = parts.concat([CARRY,MOVE,MOVE]);
        } else if (data.role == 'stationaryUpgrader') {
            let cost = 100;
            let maxCost = spawn.room.energyCapacityAvailable;
            parts = [];
            while (cost < maxCost) {
                for (let i = 0; i < 10 && cost+100 <= maxCost; i++, cost += 100) {
                    parts.unshift(WORK);
                }
                if (cost < maxCost) {
                    parts.push(MOVE);
                    cost += 50;
                }
                if (cost< maxCost) {
                    parts.push(CARRY);
                    cost += 50;
                }
            }
            parts.push(CARRY,MOVE);
        } else if (data.role == 'hauler' || data.role == 'upgradeHauler') {
            let numberParts = Math.floor(spawn.room.energyCapacityAvailable / 150);
            if (data.role == 'hauler') {numberParts--;}
            if (partNumber > 0 && partNumber+1 < numberParts) {
                numberParts = partNumber;
            }
            if (data.role == 'hauler') {
                parts = Array(numberParts*2).fill(CARRY);
                parts = parts.concat(Array(numberParts+1).fill(MOVE));
                parts.unshift(WORK);
            } else {
                parts = Array(numberParts*2).fill(CARRY);
                parts = parts.concat(Array(numberParts).fill(MOVE));
            }
        } else if (data.role == 'spawnHelper') {
            let numberParts = Math.floor(spawn.room.energyCapacityAvailable / 150);
            parts = Array(numberParts).fill(CARRY);
            parts = parts.concat(Array(numberParts).fill(CARRY));
            parts = parts.concat(Array(numberParts).fill(MOVE));
            data.gathering = true;
        } else if (data.role == 'harvester') {
            parts = [WORK,CARRY,MOVE,MOVE];
            data.gathering = true;
        } else if (data.role == 'decoy') {
            parts = [TOUGH,MOVE];
            // let numberParts = Math.floor(spawn.room.energyCapacityAvailable / 100);
            // for (let i = 0; i < Math.min(8,numberParts); i++) {
            //     parts = parts.concat([TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,MOVE]);
            // }
        } else if (data.role == 'attacker') {
            let numberParts = partNumber ? partNumber : Math.floor(spawn.room.energyCapacityAvailable / 130);
            for (let i = 0; i < Math.min(numberParts, 5); i++) {
                parts = parts.concat([ATTACK,MOVE]);
            }
        } else if (data.role == 'guard') {
            let numberParts = partNumber ? partNumber : Math.floor((spawn.room.energyCapacityAvailable - 300) / 130);
            parts = Array(numberParts+1).fill(MOVE);
            parts = parts.concat(Array(numberParts-2).fill(ATTACK));
            parts.push(HEAL);
            parts.push(ATTACK,ATTACK);
        } else if (data.role == 'attackerRanged') {
            let numberParts = Math.floor(spawn.room.energyCapacityAvailable / 200);
            parts = Array(numberParts).fill(MOVE);
            parts = parts.concat(Array(numberParts).fill(RANGED_ATTACK));
        } else if (data.role == 'scout') {
            parts = [MOVE];
        } else if (data.role == 'claimer') {
            parts = [CLAIM,MOVE];
        } else {
            if (spawn.room.energyCapacityAvailable < 350) {
                parts = [WORK, CARRY, CARRY, MOVE, MOVE];
            } else {
                let numberParts = Math.min(3,Math.floor(spawn.room.energyCapacityAvailable / 350));
                parts = Array(numberParts).fill(WORK);
                parts = parts.concat(Array(numberParts*2).fill(CARRY));
                parts = parts.concat(Array(numberParts*3).fill(MOVE));
                data.gathering = true;
            }
        }
        name = spawn.createCreep(parts, this.getName(name), data);
        if (name == -10) {
            console.log("Error spawning creep: " + name + parts);
        } else if (name == -3) {
            console.log("Error! Trying to spawn creep with same name");
        } else if (name == -6 && spawn.room.energyAvailable == spawn.room.energyCapacityAvailable) {
            console.log("Error! Trying to spawn creep that costs too much" + data.role + parts);
        }
        if (typeof(name) == 'string') {
            logStr = spawn.name + " spawning creep " + name + " in room " + spawn.room.name + " in " + parts.length*3 + " ticks." + JSON.stringify(data);
            console.log(logStr);
        }
        return name;
    },

    getName: function(name, num) {
        if (num == undefined) {
            num = 0;
        }
        if (!((name + num) in Game.creeps)) {
            return name + num;
        } else {
            return this.getName(name, num+1);
        }
    }
};
