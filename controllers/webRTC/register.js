module.exports = class Register {
    constructor() {
        // this.usersByName = {};
        this.userSessionInfos = {};
        // this.usersByUserId = {};
    }


    register(user) {
        
        try {
            // this.usersByName[user.name] = user;
            let userSessionIds = Object.values(this.userSessionInfos).filter(item => {
                return (item.roomName === user.roomName && item.userId === user.userId ) 
             }).map(item2=> item2.id);
    
             for (let userSessionId of userSessionIds) {
                 delete this.userSessionInfos(userSessionId)
             }
    
            // this.usersByUserId[user.userId] = user;
            // console.log('register userId :' , this.usersByUserId[user.userId] )
            this.userSessionInfos[user.id] = user;
            
            // console.log('this.usersByUserId')
            // console.log(this.usersByUserId)
            // console.log('this.userSessionIds')
            // console.log(this.userSessionIds)
        } catch (error) {
            console.log(error)
        }

        
    }

    unregister(socketId) {
        console.log('this.userSessionInfos----------------------------------------')
        console.log(this.userSessionInfos)
        console.log('----------------------------------------')
            delete this.userSessionInfos[socketId];
            console.log('----------------------------------------')
            console.log(this.userSessionInfos)
            console.log('this.userSessionIdsDelete----------------------------------------')
    }



    // getByUserId(userId) {
    //     return this.usersByUserId[userId];
    // }

    getById(id) {
        return this.userSessionInfos[id];
    }
 

    getByRoomAndId(id, roomName) {

        console.log(id, roomName)

 
        let userSession = Object.values(this.userSessionInfos).filter(item => {
            return (item.roomName === roomName && item.userId === id ) 
         });
         
         return userSession[userSession.length-1]
    }

}