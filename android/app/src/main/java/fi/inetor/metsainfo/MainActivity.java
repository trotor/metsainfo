package fi.inetor.metsainfo;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Sovelluksen omat pluginit rekisteröidään ennen Capacitorin käynnistystä
        registerPlugin(PurchasesPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
