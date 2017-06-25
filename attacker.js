module.exports = function (creep) {
    if (creep.pos.roomName == creep.memory.targetRoom) {
        var target = creep.pos.findClosestByPath(FIND_HOSTILE_SPAWNS);
        if (target == null) {
            target = creep.pos.findClosestByPath(FIND_HOSTILE_CREEPS);
        }
        if(target != null && creep.attack(target) == ERR_NOT_IN_RANGE) {
            creep.moveTo(target);
        }
    } else {
        creep.moveTo(new RoomPosition(25,25,creep.memory.targetRoom));
    }
}
