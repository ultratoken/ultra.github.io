let INITTOKENVALUE = 100.000;

$(window).bind("load", async function () {
    let ssc;

    let rpc_nodes = [
        "https://api.deathwing.me",
        "https://hive.roelandp.nl",
        "https://api.openhive.network",
        "https://rpc.ausbit.dev",
        "https://hived.emre.sh",
        "https://hive-api.arcange.eu",
        "https://api.hive.blog",
        "https://api.c0ff33a.uk",
        "https://rpc.ecency.com",
        "https://anyx.io",
        "https://techcoderx.com",
        "https://api.hive.blue",
        "https://rpc.mahdiyari.info"
    ];

    let he_rpc_nodes = [
        "https://api.primersion.com",
        "https://enginerpc.com", 
        "https://api.hive-engine.com",        
        "https://herpc.actifit.io"
    ];

    // Function to populate the dropdown box with RPC nodes for Hive
    async function populateHiveApiDropdown() {
        try {
            const dropdown = document.getElementById("rpc-nodes-dropdown");
            if (!dropdown) return;

            rpc_nodes.forEach(node => {
                const option = document.createElement("option");
                option.value = node;
                option.text = node;
                dropdown.appendChild(option);
            });

            const selectedHiveEndpoint = localStorage.getItem("selectedUltraHiveEndpoint");
            if (selectedHiveEndpoint) {
                dropdown.value = selectedHiveEndpoint;
            }
        } catch (error) {
            console.error("Error at populateHiveApiDropdown():", error);
        }        
    };

    // Function to populate the dropdown box with RPC nodes for Engine (Hive-Engine)
    async function populateHEApiDropdown() {
        try {
            const dropdown = document.getElementById("herpc-nodes-dropdown");
            if (!dropdown) return;

            he_rpc_nodes.forEach(node => {
                const option = document.createElement("option");
                option.value = node;
                option.text = node;
                dropdown.appendChild(option);
            });

            const selectedEngineEndpoint = localStorage.getItem("selectedUltraEngineEndpoint");
            if (selectedEngineEndpoint) {
                dropdown.value = selectedEngineEndpoint;
            }
        } catch (error) {
            console.error("Error at populateHEApiDropdown():", error);
        }        
    };
    
    // Populate the dropdowns
    await populateHiveApiDropdown();
    await populateHEApiDropdown();

    async function selectHiveNode() {
        try {
            const dropdown = document.getElementById("rpc-nodes-dropdown");
            if (!dropdown) return;

            dropdown.addEventListener("change", function () {
                const selectedRpcNode = this.value;
                hive.api.setOptions({ url: selectedRpcNode });
                console.log("Selected Hive RPC Node:", selectedRpcNode);

                localStorage.setItem("selectedUltraHiveEndpoint", selectedRpcNode);

                setTimeout(() => {
                    location.reload();
                }, 1000);
            });
        } catch (error) {
            console.error("Error at selectHiveNode():", error);
        }
    };

    async function selectEngineNode() {
        try {
            const dropdown = document.getElementById("herpc-nodes-dropdown");
            if (!dropdown) return;

            dropdown.addEventListener("change", function () {
                const selectedRpcNode = this.value;
                
                if (ssc) {
                    ssc.setOptions({ url: selectedRpcNode });
                    console.log("Selected Engine RPC Node:", selectedRpcNode);
                    
                    localStorage.setItem("selectedUltraEngineEndpoint", selectedRpcNode);
                    
                    setTimeout(() => {
                        location.reload();
                    }, 1000);
                } else {
                    console.error("SSC instance is not initialized.");
                }
            });
        } catch (error) {
            console.error("Error at selectEngineNode():", error);
        }
    };

    // Retrieve stored RPC endpoints or use defaults
    function getSelectedHiveEndpoint() {
        return localStorage.getItem("selectedUltraHiveEndpoint") || "https://anyx.io"; // Default endpoint
    }

    function getSelectedEngineEndpoint() {
        return localStorage.getItem("selectedUltraEngineEndpoint") || "https://api.primersion.com"; // Default endpoint
    }    

    async function processAPIs() {
        try {
            console.log("Initializing APIs...");
            await initializeHiveAPI();
            await initializeEngineAPI();
            console.log("APIs initialized.");

            await processCalculation();
        } catch (error) {
            console.error("Error while processing APIs:", error);
        }
    }

    hive.config.set('alternative_api_endpoints', rpc_nodes); 
    
    async function initializeHiveAPI() {
        const selectedHiveEndpoint = getSelectedHiveEndpoint();
        console.log("Selected Hive API Node:", selectedHiveEndpoint);
        hive.api.setOptions({ url: selectedHiveEndpoint });

        const dropdown = document.getElementById("rpc-nodes-dropdown");
        if (dropdown) {
            dropdown.value = selectedHiveEndpoint;
        }
    }

    async function initializeEngineAPI() {
        const selectedEngineEndpoint = getSelectedEngineEndpoint();
        console.log("Selected Engine API Node:", selectedEngineEndpoint);
        
        ssc = new SSC(selectedEngineEndpoint);

        const dropdown = document.getElementById("herpc-nodes-dropdown");
        if (dropdown) {
            dropdown.value = selectedEngineEndpoint;
        }
    }

    await processAPIs();

    await selectHiveNode();
    await selectEngineNode();

    function dec(val) {
        return Math.floor(val * 1000) / 1000;
    };

    async function processCalculation() {
        try {
            // Now that ssc is initialized, you can safely call functions that depend on it
            const initTokenValue = await loadTokenFigures();
            const circulatingSupply = await getUltraCirculatingSupply(); // Ensure this is awaited and called after initialization            
            const hiveBalance = await getHiveBalance("ultra.hive");
            const hbdBalance = await getHiveDollarBalance("ultra.hbd");            
            const hbdToHive = await getHBDToHIVE();            
            const totalHbdToHive = await calcHbdToHive(hbdBalance, hbdToHive);            
            const totalRevenueInHive = await calcRevenueInHive(hiveBalance, totalHbdToHive); 
            const initProjectVal = await initialProjectValue(initTokenValue, circulatingSupply);
            const currentProjectValue = await currentProjectVal(initProjectVal, totalRevenueInHive); 
            const currentTokenValue = await currentTokenVal(currentProjectValue, circulatingSupply);          
        } catch (error) {
            console.log("Error at processCalculation():", error);
        }
    }    

    async function loadTokenFigures() {
        try {
            let initToken = INITTOKENVALUE.toFixed(3);

            // Format the value with commas for thousands separator
            const formattedValue = new Intl.NumberFormat().format(initToken);

            const initTokenValue = document.getElementById('initTokenValue');
            initTokenValue.textContent = formattedValue + " HIVE"; // Ensures 3 decimal places
            return initToken;
        } catch (error) {
            console.log("Error at loadTokenFigures():", error);
            return 0.0;
        }
    }

    async function getHiveBalance(account) {
        try {
            const res = await hive.api.getAccountsAsync([account]);
            if(res.length > 0) {
                let hiveBalance = dec(parseFloat(res[0].balance.split(" ")[0]));

                // Format the value with commas for thousands separator
                const formattedValue = new Intl.NumberFormat().format(hiveBalance);

                const hiveRevenue = document.getElementById('hiveRevenue');
                hiveRevenue.textContent = formattedValue + " HIVE";
                return hiveBalance; 
            }
        } catch (error) {
            console.log("Error at getHiveBalance():", error);
            return 0.0;
        }
    }

    async function getHiveDollarBalance(account) {
        try {
            const res = await hive.api.getAccountsAsync([account]);
            if(res.length > 0) {
                let calcBalances = dec(parseFloat(res[0].hbd_balance.split(" ")[0]) + parseFloat(res[0].savings_hbd_balance.split(" ")[0]));

                // Format the value with commas for thousands separator
                const formattedValue = new Intl.NumberFormat().format(calcBalances);

                const hbdRevenue = document.getElementById('hbdRevenue');
                hbdRevenue.textContent = formattedValue + " HBD"; 
                return calcBalances;
            }
            return 0.0;
        } catch (error) {
            console.log("Error at getHiveDollarBalance():", error);
            return 0.0;
        }
    }

    async function getUltraCirculatingSupply() {
        try {
            const ultraSupplyRes = await ssc.find('tokens', 'tokens', {symbol:"ULTRA"}, 1000, 0, []);

            if (ultraSupplyRes && ultraSupplyRes.length > 0) {
                const circulatingSupply = dec(parseFloat(ultraSupplyRes[0].circulatingSupply));

                // Format the value with commas for thousands separator
                const formattedValue = new Intl.NumberFormat().format(circulatingSupply);

                const ultraSupplyElement = document.getElementById('circulatingSupply');
                ultraSupplyElement.textContent = formattedValue + " ULTRA";
                return circulatingSupply; 
            }
            return 0.0;
        } catch (error) {
            console.log("Error at getUltraCirculatingSupply():", error);
            return 0.0;
        }
    }

    async function callGetMarketTicker() {
        return new Promise((resolve, reject) => {
            hive.api.getTicker((err, result) => {
                if (err) 
                {
                    reject(err);
                } 
                else 
                {
                    resolve(result);
                }
            });
        });
    }

    async function getHBDToHIVE() {
        try {
            const response = await callGetMarketTicker();

            let bidPrice = parseFloat(response.highest_bid) || 0.0;
            let askPrice = parseFloat(response.lowest_ask) || 0.0;
    
            // Calculate average price
            let avgPrice = (bidPrice + askPrice) / 2;
    
            // Get the value of 1 HBD in terms of HIVE
            let hbdHiveValue = (1 / avgPrice).toFixed(3); // Inverse of the average price (1 HBD = X HIVE)    
            return hbdHiveValue;    
        } catch (error) {
            console.log("Error at getHBDToHIVE() : ", error); 
            return 0.0;   
        }
    }

    async function calcHbdToHive(hbdBalance, hbdToHive) {
        try {
            let hbdToHiveValue = dec(parseFloat(hbdBalance * hbdToHive));

            // Format the value with commas for thousands separator
            const formattedValue = new Intl.NumberFormat().format(hbdToHiveValue);

            const hbdToHivePrice = document.getElementById('hbdToHive');
            hbdToHivePrice.textContent = formattedValue + " HIVE";
            return hbdToHiveValue;
        } catch (error) {
            console.log("Error at calcHbdToHive():", error);
            return 0.0;
        }
    }

    async function calcRevenueInHive(hiveBalance, totalHbdToHive) {
        try {
            let totalRevenue = dec(hiveBalance + totalHbdToHive);

            // Format the value with commas for thousands separator
            const formattedValue = new Intl.NumberFormat().format(totalRevenue);

            const totalRevenueInHive = document.getElementById('totalRevenueInHive');
            totalRevenueInHive.textContent = formattedValue + " HIVE";
            return totalRevenue;
        } catch (error) {
            console.log("Error at calcRevenueInHive():", error); 
            return 0.0;   
        }
    }

    async function initialProjectValue(initTokenValue, circulatingSupply) {
        try {
            let initValue = dec(parseFloat(initTokenValue * circulatingSupply));

            // Format the value with commas for thousands separator
            const formattedValue = new Intl.NumberFormat().format(initValue);

            const initProjectValue = document.getElementById('initProjectValue');
            initProjectValue.textContent = formattedValue + " HIVE";
            return initValue;
        } catch (error) {
            console.log("Error at initialProjectValue():", error); 
            return 0.0;    
        }
    }

    async function currentProjectVal(initProjectValue, revenueInHive) {
        try {
            let currentValue = dec(parseFloat(initProjectValue + revenueInHive));
            
            // Format the value with commas for thousands separator
            const formattedValue = new Intl.NumberFormat().format(currentValue);

            const currentProjectValue = document.getElementById('currentProjectValue');
            currentProjectValue.textContent = formattedValue + " HIVE";
            return currentValue;
        } catch (error) {
            console.log("Error at currentProjectVal():", error);
            return 0.0; 
        }        
    }

    async function currentTokenVal(currentProjectVal, circulatingSupply) {
        try {
            let tokenValue = dec(parseFloat(currentProjectVal / circulatingSupply));
            
            // Format the value with commas for thousands separator
            const formattedValue = new Intl.NumberFormat().format(tokenValue);

            const currentTokenValue = document.getElementById('currentTokenValue');
            currentTokenValue.textContent = formattedValue + " HIVE";
            return tokenValue;
        } catch (error) {
            console.log("Error at currentTokenVal():", error);
            return 0.0; 
        }        
    }

    $(document).ready(async function () {
        $(".refreshInfo").on("click", function () {
            console.log("Refreshing token info...");
            
            // Fetch the latest token info
            processCalculation();  // Assuming this function updates token info
    
            console.log("Token info refreshed.");
        });
    });
});
