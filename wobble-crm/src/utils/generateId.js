export const generateJobId = () => {
    const random = Math.floor(100000 + Math.random() * 900000);
    return "WOB" + Date.now().toString().slice(-6) + random;
};