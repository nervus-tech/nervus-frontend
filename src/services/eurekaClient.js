const axios = require('axios');

class EurekaClient {
    constructor(serviceName, hostName, port, eurekaUrl) {
        this.serviceName = serviceName;
        this.hostName = hostName;
        this.port = port;
        this.eurekaUrl = eurekaUrl;
        this.heartbeatInterval = null;
    }

    async registerWithEureka() {
        try {
            const eurekaData = {
                instance: {
                    hostName: this.hostName,
                    app: this.serviceName,
                    ipAddr: this.hostName,
                    status: "UP",
                    overriddenstatus: "UNKNOWN",
                    port: {
                        $: this.port,
                        "@enabled": "true"
                    },
                    securePort: {
                        $: 443,
                        "@enabled": "false"
                    },
                    countryId: 1,
                    dataCenterInfo: {
                        "@class": "com.netflix.appinfo.InstanceInfo$DefaultDataCenterInfo",
                        name: "MyOwn"
                    },
                    leaseInfo: {
                        renewalIntervalInSecs: 30,
                        durationInSecs: 90,
                        registrationTimestamp: 0,
                        lastRenewalTimestamp: 0,
                        evictionTimestamp: 0,
                        serviceUpTimestamp: 0
                    },
                    metadata: {
                        "@class": "java.util.Collections$EmptyMap"
                    },
                    homePageUrl: `http://${this.hostName}:${this.port}/`,
                    statusPageUrl: `http://${this.hostName}:${this.port}/health`,
                    healthCheckUrl: `http://${this.hostName}:${this.port}/health`,
                    vipAddress: this.serviceName,
                    secureVipAddress: this.serviceName,
                    isCoordinatingDiscoveryServer: "false",
                    lastUpdatedTimestamp: "0",
                    lastDirtyTimestamp: "0",
                    actionType: "ADDED"
                }
            };

            const response = await axios.post(
                `${this.eurekaUrl}/eureka/apps/${this.serviceName}`,
                eurekaData,
                {
                    headers: { "Content-Type": "application/json" }
                }
            );

            if (response.status === 204) {
                console.log(`Successfully registered with Eureka at ${this.eurekaUrl}`);
                return true;
            } else {
                console.error(`Failed to register with Eureka: ${response.status}`);
                return false;
            }

        } catch (error) {
            console.error(`Error registering with Eureka: ${error.message}`);
            return false;
        }
    }

    async heartbeatEureka() {
        try {
            const response = await axios.put(
                `${this.eurekaUrl}/eureka/apps/${this.serviceName}/${this.hostName}`
            );
            if (response.status !== 200) {
                console.warn(`Heartbeat failed: ${response.status}`);
            }
        } catch (error) {
            console.error(`Heartbeat error: ${error.message}`);
        }
    }

    startHeartbeat() {
        this.heartbeatInterval = setInterval(() => {
            this.heartbeatEureka();
        }, 30000); // 30 seconds
        console.log("Started Eureka heartbeat");
    }

    stopHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
            console.log("Stopped Eureka heartbeat");
        }
    }
}

function createEurekaClient() {
    const serviceName = process.env.SERVICE_NAME || "FRONTEND";
    const hostName = process.env.HOST_NAME || "frontend-staging";
    const port = parseInt(process.env.SERVICE_PORT || "3000");
    const eurekaUrl = process.env.EUREKA_URL || "http://eureka:8761";

    return new EurekaClient(serviceName, hostName, port, eurekaUrl);
}

module.exports = { EurekaClient, createEurekaClient }; 