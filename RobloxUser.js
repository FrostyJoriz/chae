const axios = require("axios");

const axiosInstance = axios.create({
    headers: {
        'User-Agent': 'Roblox/WinInet',
        'Accept': 'application/json',
        'Referer': 'https://www.roblox.com',
    },
    withCredentials: true,
});

class RobloxUser {
    constructor(roblosecurityCookie, userId, username, displayName) {
        this.roblosecurityCookie = roblosecurityCookie;
        this.userId = userId;
        this.username = username;
        this.displayName = displayName;
    }

    async doAuthorizedRequest(url) {
        const response = await axiosInstance.get(url, {
            headers: {
                Cookie: `.ROBLOSECURITY=${this.roblosecurityCookie}`,
            },
        });
        return response.data;
    }

    static async register(roblosecurityCookie) {
        try {
            const response = await axiosInstance.get("https://users.roblox.com/v1/users/authenticated", {
                headers: {
                    Cookie: `.ROBLOSECURITY=${roblosecurityCookie}`,
                },
            });

            const data = response.data;

            return new RobloxUser(roblosecurityCookie, data.id, data.name, data.displayName);
        } catch (err) {
            console.error("❌ Failed to register RobloxUser:", err.response?.status, err.response?.data || err.message);
            throw new Error("Roblox cookie is invalid or request was blocked.");
        }
    }

    async getAccountCreationDate() {
        const { created } = await this.doAuthorizedRequest(`https://users.roblox.com/v1/users/${this.userId}`);
        return new Intl.DateTimeFormat("en-US", { dateStyle: "long", timeStyle: "long" }).format(new Date(created));
    }

    async getAccountPremiumStatus() {
        try {
            await this.doAuthorizedRequest(`https://premiumfeatures.roblox.com/v1/users/${this.userId}/subscriptions`);
            return true;
        } catch {
            return false;
        }
    }

    async getAccount2FAStatus() {
        const { twoStepVerificationEnabled } = await this.doAuthorizedRequest(`https://twostepverification.roblox.com/v1/metadata`);
        return twoStepVerificationEnabled;
    }

    async getAccountPinStatus() {
        const { isEnabled } = await this.doAuthorizedRequest(`https://auth.roblox.com/v1/account/pin`);
        return isEnabled;
    }

    async getAccountBalance() {
        const { robux } = await this.doAuthorizedRequest(`https://economy.roblox.com/v1/users/${this.userId}/currency`);
        return robux;
    }

    async getAccountCreditBalance() {
        const { balance } = await this.doAuthorizedRequest("https://billing.roblox.com/v1/credit");
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
        }).format(balance);
    }

    async getAccountBodyShot() {
        const { data } = await this.doAuthorizedRequest(
            `https://thumbnails.roblox.com/v1/users/avatar?userIds=${this.userId}&size=720x720&format=Png&isCircular=false`
        );
        return data[0].imageUrl;
    }

    async getAccountRAP(userId) {
        let calculatedRap = 0;
        let nextPageCursor = "";

        while (nextPageCursor !== null) {
            const inventoryPage = await this.doAuthorizedRequest(
                `https://inventory.roblox.com/v1/users/${userId}/assets/collectibles?sortOrder=Asc&limit=100&cursor=${nextPageCursor}`
            );

            calculatedRap += inventoryPage.data.reduce(
                (rap, item) => rap + (item.recentAveragePrice || 0),
                0
            );

            nextPageCursor = inventoryPage.nextPageCursor;
        }

        return calculatedRap;
    }

    async getUserData() {
        const creationDate = await this.getAccountCreationDate();
        const premiumStatus = await this.getAccountPremiumStatus();
        const twoFAStatus = await this.getAccount2FAStatus();
        const pinStatus = await this.getAccountPinStatus();
        const accountBalance = await this.getAccountBalance();

        return {
            username: this.username,
            uid: this.userId,
            displayName: this.displayName,
            avatarUrl: await this.getAccountBodyShot(),
            createdAt: creationDate,
            // country: "Unavailable", // removed broken endpoint
            balance: accountBalance,
            isTwoStepVerificationEnabled: twoFAStatus,
            isPinEnabled: pinStatus,
            isPremium: premiumStatus,
            creditbalance: await this.getAccountCreditBalance(),
            rap: await this.getAccountRAP(this.userId),
        };
    }
}

module.exports = {
    RobloxUser,
};
