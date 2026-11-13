package fi.inetor.metsainfo;

import com.android.billingclient.api.AcknowledgePurchaseParams;
import com.android.billingclient.api.BillingClient;
import com.android.billingclient.api.BillingClientStateListener;
import com.android.billingclient.api.BillingFlowParams;
import com.android.billingclient.api.BillingResult;
import com.android.billingclient.api.PendingPurchasesParams;
import com.android.billingclient.api.ProductDetails;
import com.android.billingclient.api.Purchase;
import com.android.billingclient.api.PurchasesUpdatedListener;
import com.android.billingclient.api.QueryProductDetailsParams;
import com.android.billingclient.api.QueryPurchasesParams;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.function.Consumer;

/**
 * Sovelluksen sisäiset ostot Google Play Billingillä. JS-nimi "Purchases",
 * sama rajapinta kuin iOS:n StoreKit-pluginilla (js/platform/purchases.js).
 * Ostot kuitataan (acknowledge), muuten Play hyvittää ne kolmen päivän kuluttua.
 */
@CapacitorPlugin(name = "Purchases")
public class PurchasesPlugin extends Plugin implements PurchasesUpdatedListener {

    private BillingClient billing;
    private PluginCall purchaseCall;

    @Override
    public void load() {
        billing = BillingClient.newBuilder(getContext())
            .setListener(this)
            .enablePendingPurchases(PendingPurchasesParams.newBuilder().enableOneTimeProducts().build())
            .enableAutoServiceReconnection()
            .build();
    }

    @Override
    protected void handleOnDestroy() {
        if (billing != null) billing.endConnection();
    }

    private void connected(PluginCall call, Runnable onReady) {
        if (billing.isReady()) {
            onReady.run();
            return;
        }
        billing.startConnection(new BillingClientStateListener() {
            @Override
            public void onBillingSetupFinished(BillingResult result) {
                if (result.getResponseCode() == BillingClient.BillingResponseCode.OK) onReady.run();
                else call.reject("Google Play ei ole käytettävissä (" + result.getResponseCode() + ")");
            }

            @Override
            public void onBillingServiceDisconnected() {
                // Automaattinen uudelleenyhdistys (enableAutoServiceReconnection)
            }
        });
    }

    private void queryDetails(PluginCall call, List<String> ids, Consumer<List<ProductDetails>> onResult) {
        List<QueryProductDetailsParams.Product> products = new ArrayList<>();
        for (String id : ids) {
            products.add(QueryProductDetailsParams.Product.newBuilder()
                .setProductId(id)
                .setProductType(BillingClient.ProductType.INAPP)
                .build());
        }
        QueryProductDetailsParams params = QueryProductDetailsParams.newBuilder().setProductList(products).build();
        billing.queryProductDetailsAsync(params, (result, details) -> {
            if (result.getResponseCode() != BillingClient.BillingResponseCode.OK) {
                call.reject("Tuotetietoja ei saatu (" + result.getResponseCode() + ")");
                return;
            }
            onResult.accept(details.getProductDetailsList());
        });
    }

    private static ProductDetails.OneTimePurchaseOfferDetails offerOf(ProductDetails d) {
        List<ProductDetails.OneTimePurchaseOfferDetails> offers = d.getOneTimePurchaseOfferDetailsList();
        return offers == null || offers.isEmpty() ? null : offers.get(0);
    }

    private static List<String> idsOf(PluginCall call) {
        List<String> ids = new ArrayList<>();
        JSArray array = call.getArray("productIds");
        if (array == null) return ids;
        for (int i = 0; i < array.length(); i++) ids.add(array.optString(i));
        return ids;
    }

    @PluginMethod
    public void getProducts(PluginCall call) {
        List<String> ids = idsOf(call);
        connected(call, () -> queryDetails(call, ids, details -> {
            JSArray products = new JSArray();
            for (ProductDetails d : details) {
                ProductDetails.OneTimePurchaseOfferDetails offer = offerOf(d);
                if (offer == null) continue;
                JSObject p = new JSObject();
                p.put("id", d.getProductId());
                p.put("title", d.getName());
                p.put("description", d.getDescription());
                p.put("displayPrice", offer.getFormattedPrice());
                products.put(p);
            }
            JSObject ret = new JSObject();
            ret.put("products", products);
            call.resolve(ret);
        }));
    }

    @PluginMethod
    public void purchase(PluginCall call) {
        String id = call.getString("productId");
        if (id == null) {
            call.reject("productId puuttuu");
            return;
        }
        connected(call, () -> queryDetails(call, Collections.singletonList(id), details -> {
            ProductDetails product = details.isEmpty() ? null : details.get(0);
            ProductDetails.OneTimePurchaseOfferDetails offer = product == null ? null : offerOf(product);
            if (offer == null) {
                call.reject("Tuotetta ei löytynyt");
                return;
            }
            BillingFlowParams flow = BillingFlowParams.newBuilder()
                .setProductDetailsParamsList(Collections.singletonList(
                    BillingFlowParams.ProductDetailsParams.newBuilder()
                        .setProductDetails(product)
                        .setOfferToken(offer.getOfferToken())
                        .build()))
                .build();
            call.setKeepAlive(true);
            purchaseCall = call;
            getActivity().runOnUiThread(() -> {
                BillingResult result = billing.launchBillingFlow(getActivity(), flow);
                if (result.getResponseCode() != BillingClient.BillingResponseCode.OK && purchaseCall == call) {
                    purchaseCall = null;
                    call.setKeepAlive(false);
                    call.reject("Ostoa ei voitu aloittaa (" + result.getResponseCode() + ")");
                }
            });
        }));
    }

    @Override
    public void onPurchasesUpdated(BillingResult result, List<Purchase> purchases) {
        String status;
        int code = result.getResponseCode();
        if (code == BillingClient.BillingResponseCode.OK && purchases != null) {
            status = "unknown";
            for (Purchase p : purchases) {
                if (p.getPurchaseState() == Purchase.PurchaseState.PURCHASED) {
                    acknowledge(p);
                    status = "purchased";
                } else if (p.getPurchaseState() == Purchase.PurchaseState.PENDING && !"purchased".equals(status)) {
                    status = "pending";
                }
            }
        } else if (code == BillingClient.BillingResponseCode.USER_CANCELED) {
            status = "cancelled";
        } else if (code == BillingClient.BillingResponseCode.ITEM_ALREADY_OWNED) {
            status = "purchased";
        } else {
            status = null;
        }

        PluginCall call = purchaseCall;
        purchaseCall = null;
        if (call != null) {
            call.setKeepAlive(false);
            if (status != null) {
                JSObject ret = new JSObject();
                ret.put("status", status);
                call.resolve(ret);
            } else {
                call.reject("Osto ei onnistunut (" + code + ")");
            }
        }
        // Myös odottavan oston valmistuminen myöhemmin tulee tänne
        notifyListeners("entitlementsChanged", new JSObject());
    }

    private void acknowledge(Purchase p) {
        if (p.isAcknowledged()) return;
        AcknowledgePurchaseParams params = AcknowledgePurchaseParams.newBuilder()
            .setPurchaseToken(p.getPurchaseToken())
            .build();
        billing.acknowledgePurchase(params, r -> { /* yritetään uudelleen seuraavalla tarkistuksella */ });
    }

    @PluginMethod
    public void getEntitlements(PluginCall call) {
        connected(call, () -> billing.queryPurchasesAsync(
            QueryPurchasesParams.newBuilder().setProductType(BillingClient.ProductType.INAPP).build(),
            (result, purchases) -> {
                if (result.getResponseCode() != BillingClient.BillingResponseCode.OK) {
                    call.reject("Ostoja ei saatu tarkistettua (" + result.getResponseCode() + ")");
                    return;
                }
                JSArray owned = new JSArray();
                for (Purchase p : purchases) {
                    if (p.getPurchaseState() != Purchase.PurchaseState.PURCHASED) continue;
                    acknowledge(p);
                    for (String id : p.getProducts()) owned.put(id);
                }
                JSObject ret = new JSObject();
                ret.put("owned", owned);
                call.resolve(ret);
            }));
    }

    @PluginMethod
    public void restore(PluginCall call) {
        // Play palauttaa omistetut ostot suoraan queryPurchasesAsync-kyselyllä
        call.resolve();
    }
}
