module.exports = function (io, socket, app) {
    socket.on('draw:video', async ({ room_id, data }) => {
        console.log(room_id, socket.id)
        // socket.broadcast.to(socket.)
        socket.to(room_id).emit('draw:video', { drawingEvent: data, socket_id: socket.id });


        console.log(data);
        const drawData = {

        }
    })
}