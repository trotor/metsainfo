import Capacitor

/// Capacitorin näkymä, johon rekisteröidään sovelluksen omat pluginit.
class MainViewController: CAPBridgeViewController {
    override open func capacitorDidLoad() {
        bridge?.registerPluginInstance(PurchasesPlugin())
    }
}
