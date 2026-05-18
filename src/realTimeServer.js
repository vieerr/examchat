module.exports = (httpServer) => {
  const { Server } = require("socket.io");
  const io = new Server(httpServer);
  io.on("connection", (socket) => {
    const cookieHeader = socket.request.headers.cookie || "";
    const cookies = Object.fromEntries(
      cookieHeader.split(";").map((c) => {
        const [k, ...v] = c.split("=");
        if (!k) return ["", ""];
        return [k.trim(), decodeURIComponent((v || []).join("=").trim())];
      })
    );
    const user = cookies.username || "anonymous";

    socket.on("alert", (data) => {
      io.emit("alert", {
        user,
        message: data.message,
        type: data.type || "GENERAL",
        date: new Date().toLocaleTimeString(),
      });
    });
  });
};
