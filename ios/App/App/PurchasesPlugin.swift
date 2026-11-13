import Capacitor
import StoreKit

/// Sovelluksen sisäiset ostot StoreKit 2:lla (iOS 15+). JS-nimi "Purchases",
/// rajapinta js/platform/purchases.js. Ei kolmannen osapuolen palveluja:
/// transaktiot tarkistetaan laitteella StoreKitin allekirjoituksella.
@objc(PurchasesPlugin)
public class PurchasesPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "PurchasesPlugin"
    public let jsName = "Purchases"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "getProducts", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "purchase", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getEntitlements", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "restore", returnType: CAPPluginReturnPromise)
    ]

    private var updates: Task<Void, Never>?

    override public func load() {
        // Muualla tehdyt tai viivästyneet (esim. vanhemman hyväksymät) ostot
        updates = Task.detached {
            for await result in Transaction.updates {
                if case .verified(let transaction) = result {
                    await transaction.finish()
                }
            }
        }
    }

    deinit {
        updates?.cancel()
    }

    @objc func getProducts(_ call: CAPPluginCall) {
        let ids = call.getArray("productIds", String.self) ?? []
        Task {
            do {
                let products = try await Product.products(for: ids)
                call.resolve(["products": products.map { product in
                    [
                        "id": product.id,
                        "title": product.displayName,
                        "description": product.description,
                        "displayPrice": product.displayPrice
                    ]
                }])
            } catch {
                call.reject(error.localizedDescription)
            }
        }
    }

    @objc func purchase(_ call: CAPPluginCall) {
        guard let id = call.getString("productId") else {
            call.reject("productId puuttuu")
            return
        }
        Task {
            do {
                guard let product = try await Product.products(for: [id]).first else {
                    call.reject("Tuotetta ei löytynyt")
                    return
                }
                switch try await product.purchase() {
                case .success(let verification):
                    switch verification {
                    case .verified(let transaction):
                        await transaction.finish()
                        call.resolve(["status": "purchased"])
                    case .unverified:
                        call.reject("Ostoa ei voitu vahvistaa")
                    }
                case .userCancelled:
                    call.resolve(["status": "cancelled"])
                case .pending:
                    call.resolve(["status": "pending"])
                @unknown default:
                    call.resolve(["status": "unknown"])
                }
            } catch {
                call.reject(error.localizedDescription)
            }
        }
    }

    @objc func getEntitlements(_ call: CAPPluginCall) {
        Task {
            var owned: [String] = []
            for await result in Transaction.currentEntitlements {
                if case .verified(let transaction) = result, transaction.revocationDate == nil {
                    owned.append(transaction.productID)
                }
            }
            call.resolve(["owned": owned])
        }
    }

    @objc func restore(_ call: CAPPluginCall) {
        Task {
            do {
                try await AppStore.sync()
                call.resolve()
            } catch {
                call.reject(error.localizedDescription)
            }
        }
    }
}
