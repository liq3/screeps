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
        let numberContainers = 0;
        for (let {source,path} of sourceList) {
            let miners = _.filter(Game.creeps, c => c.memory.sourceId == source.id && c.memory.role == 'miner');
            if (minerTargetId == null && (miners.length == 0 || (miners.length == 1 && miners[0].ticksToLive < ((path.cost+11)*3))) && !(Memory.dangerRooms.includes(source.pos.roomName))) {
                minerTargetId = source.id;
            } else if (miners.length > 0) {
                let containers = source.pos.findInRange(FIND_STRUCTURES, 1, {filter: s => s.structureType == STRUCTURE_CONTAINER});
                if (containers.length > 0) {
                    desiredTransportCapacity += Math.ceil( 2 * (2 * path.cost) * source.energyCapacity / ENERGY_REGEN_TIME);
                    numberContainers += 1;
                }
            }
        }
        let numberStationaryUpgraders = sumCreeps('stationaryUpgrader', spawn.room);
        if (numberStationaryUpgraders > 0) {
            let path = PathFinder.search(spawn.pos, {pos:spawn.room.controller.pos, range: 2}, {roomCallBack:global.costMatrixCallback, swamp:10, plains:2});
            for (let praiser of _.filter(Game.creeps, {filter: c => c.memory.role == 'stationaryUpgrader'})) {
                desiredTransportCapacity += 2 * path.cost * praiser.getActiveBodyparts(WORK)
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
                if ((a < 1 || (a < 2 && Game.rooms[r].controller.reservation && Game.rooms[r].controller.reservation.ticksToEnd < 4500)) && !(Memory.dangerRooms.includes(r))) {
                    reserveTargetRoom = r;
                    break;
                }
            }
        }

        let searchRooms = [];
        searchRooms = _.filter(Game.flags, f => f.name == 'claim');
        for (let i in searchRooms) {
            searchRooms[i] = searchRooms[i].pos.roomName;
            room = Game.rooms[searchRooms[i]]
            if (room && room.controller.my && room.controller.level >= 1) {
                room.createConstructionSite(Game.flags.claim.pos, STRUCTURE_SPAWN)
                Game.flags.claim.remove()
            }
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
            let attackers = _.filter(Game.creeps, c => c.memory.targetRoom == r && c.memory.job == 'attack' && c.memory.role == 'combat').length;
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
            let attackers = _.filter(Game.creeps, c => c.memory.targetRoom == r && c.memory.job == 'attack' && c.memory.role == `combat`).length;
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
        let attackFlags = _.filter(Game.flags, f => f.name.split(" ")[0] == 'attackRanged');
        let desiredAttackers = [];
        for (let i in attackFlags) {
            let flagName = attackFlags[i].name.split(" ");
            if (flagName.length > 1) {
                let num = parseInt(flagName[1]);
                if (num) {
                    desiredAttackers[i] = num;
                }
            } else {
                desiredAttackers[i] = 1;
            }
            searchRooms[i] = attackFlags[i].pos.roomName;
        }
        for (let i in searchRooms) {
            let r = searchRooms[i];
            let attackers = _.filter(Game.creeps, c => c.memory.targetRoom == r && c.memory.role == 'combat' && c.memory.job == 'attackRanged').length;
            if (attackers < desiredAttackers[i]) {
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

        let desiredBuilders = 1;
        let numberBuilders = sumCreeps ('builder', spawn.room);
        if (spawn.room.find(FIND_CONSTRUCTION_SITES).length > 0) {
            desiredBuilders = 3;
        } else if (numberBuilders > desiredBuilders) {
            best = null
            for (let creep of spawn.room.find(FIND_MY_CREEPS, {filter: c => c.memory.role == 'builder'})) {
                if (best == null || best.ticksToLive < creep.ticksToLive) {
                    if (best != null) {
                        best.memory.role = 'recycle'
                    }
                    best = creep
                } else {
                    creep.memory.role = 'recycle'
                }
            }
        }

        var RCL = spawn.room.controller.level;
        let numberHarvesters = sumCreeps('harvester', spawn.room);
        let numberSpawnHelpers = sumCreeps('spawnHelper', spawn.room);
        let numberGuards = _(Game.creeps).filter( c => c.memory.job == 'guard').length;
        let numberMiners = sumCreeps('miner', spawn.room)
        let numberHaulers = sumCreeps('hauler', spawn.room)

        if (numberHaulers < 2) {
            this.createCreep(spawn, 'H', {role:'smallHauler', bossRoom:spawn.room.name});
        } else if (spawnAttacker) {
            this.createCreep(spawn, 'A', {role:'combat',targetRoom:attackerTargetRoom,job:'attack'}, attackerParts);
        } else if (spawnAttackerRanged) {
            this.createCreep(spawn, 'AR', {role:'combat',targetRoom:attackerRangedTargetRoom, job:'attackRanged'});
        } else if (scoutTarget) {
            this.createCreep(spawn, 'S', {role:'scout', targetPos:{x:25,y:25,roomName:scoutTarget}})
        } else if (claimTargetRoom) {
            this.createCreep(spawn, "CLAIM THE ROOM", {role: 'claimer', claimRoom:claimTargetRoom});
        } else if (spawnHauler || (spawn.room.energyCapacityAvailable < 550 && numberHaulers < 5)) {
            this.createCreep(spawn, 'H', {role:'hauler', bossRoom:spawn.room.name});
        } else if (minerTargetId && RCL >= 2 && spawn.room.energyCapacityAvailable >= 550) {
            this.createCreep(spawn, 'M', {role:'miner',sourceId:minerTargetId});
        } else if (numberBuilders < desiredBuilders) {
            this.createCreep(spawn, 'B', {role:'builder'});
        } else if (numberGuards < 3) {
            this.createCreep(spawn, 'G', {role:'combat',job:'guard'});
        } else if (false && numberSpawnHelpers < 1 && spawn.room.storage && spawn.room.storage.store[RESOURCE_ENERGY] > 5000) {
            this.createCreep(spawn, 'SH', {role:'spawnHelper'});
        } else if (reserveTargetRoom && RCL > 2) {
            this.createCreep(spawn, 'C', {role:'claimer', targetRoom: reserveTargetRoom});
        } else if (decoyTargetRoom) {
            this.createCreep(spawn, 'D', {role:'decoy', targetRoom:decoyTargetRoom});
        } else if ((spawn.room.storage && numberStationaryUpgraders < Math.ceil((spawn.room.storage.store[RESOURCE_ENERGY]-50000) / (20 * spawn.room.energyCapacityAvailable)) || (spawn.room.storage == undefined && numberStationaryUpgraders < 3))) {
            this.createCreep(spawn, 'SU', {role:'stationaryUpgrader', bossRoom:spawn.room.name});
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
        } else if (data.role == 'hauler') {
            if (spawn.room.energyCapacityAvailable >= 550) {
                let numberParts = Math.floor((spawn.room.energyCapacityAvailable - 200) / 150);
                parts = [WORK]
                parts = parts.concat(Array(numberParts*2+1).fill(CARRY));
                parts = parts.concat(Array(numberParts+1).fill(MOVE));
            } else {
                let numberParts = Math.floor((spawn.room.energyCapacityAvailable - 150) / 100);
                parts = [WORK, MOVE]
                parts = parts.concat(Array(numberParts).fill(CARRY));
                parts = parts.concat(Array(numberParts).fill(MOVE));
            }
        } else if (data.role == 'smallHauler') {
            parts = [WORK, MOVE, MOVE, CARRY]
            data.role = 'hauler'
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
        } else if (data.role == 'combat') {
            if (data.job == 'attack') {
                let numberParts = partNumber ? partNumber : Math.floor(spawn.room.energyCapacityAvailable / 130);
                for (let i = 0; i < Math.min(numberParts, 5); i++) {
                    parts = parts.concat([ATTACK,MOVE]);
                }
            } else if (data.job == 'attackRanged' || data.job == 'guard') {
                let numberParts = Math.floor((spawn.room.energyCapacityAvailable - 300) / 260);
                parts = Array(numberParts).fill(TOUGH);
                parts = parts.concat(Array(numberParts*2+1).fill(MOVE));
                parts = parts.concat(Array(numberParts-1).fill(RANGED_ATTACK));
                parts.push(HEAL,RANGED_ATTACK);
            }  else if (data.job == 'guard') {
                let numberParts = partNumber ? partNumber : Math.floor((spawn.room.energyCapacityAvailable - 450) / 130);
                parts = Array(numberParts+1).fill(MOVE);
                parts = parts.concat(Array(numberParts).fill(ATTACK));
                parts.push(HEAL,RANGED_ATTACK);
            }
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
        error = spawn.createCreep(parts, this.getName(name), data);
        if (error == -10) {
            console.log("Error spawning creep: " + error + JSON.stringify(data) + parts);
        } else if (error == -3) {
            console.log("Error! Trying to spawn creep with same name");
        } else if (error == -6 && spawn.room.energyAvailable == spawn.room.energyCapacityAvailable) {
            console.log("Error! Trying to spawn creep that costs too much" + data.role + parts);
        }
        if (typeof(error) == 'string') {
            logStr = spawn.name + " spawning creep " + error + " in room " + spawn.room.name + " in " + parts.length*3 + " ticks." + JSON.stringify(data);
            console.log(logStr);
            try {
                Memory.spawnTimes[spawn.id].push({tick:Game.time, time:parts.length*3});
            } catch (err) {
                console.log(err)
            }
        }
        return error;
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
