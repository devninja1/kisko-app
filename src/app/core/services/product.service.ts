import { Injectable, inject } from '@angular/core';
import { from, Observable, of, switchMap, tap, map, firstValueFrom } from 'rxjs';
import { Product } from '../../model/product.model';
import { Firestore, collection, addDoc, doc, updateDoc, deleteDoc, collectionData, getDocs, writeBatch, increment, setDoc } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private firestore: Firestore = inject(Firestore);
  private productsCollection = collection(this.firestore, 'products');

  // Default products to populate Firestore if it's empty.
  // Note: Firestore will generate string IDs, so we don't need to provide them.
  private defaultProducts: Omit<Product, 'id'>[] = [
    { name: 'HB', category: 'Bread', description: 'Hibrid Bread', unit_price: 84, cost_price: 86, stock: 10, is_active: true },
    ];

  constructor() {
    this.loadInitialData();
  }

  /**
   * Checks if the products collection is empty and populates it with default data if it is.
   * This runs only once.
   */
  private async loadInitialData() {
    const snapshot = await getDocs(this.productsCollection);
    if (snapshot.empty) {
      console.log('No products found. Populating with default data...');
      const batch = writeBatch(this.firestore);
      this.defaultProducts.forEach(product => {
        const docRef = doc(this.productsCollection); // Firestore generates a new ID
        batch.set(docRef, product);
      });
      await batch.commit();
    }
  }

  getProducts(): Observable<Product[]> {
    // collectionData streams data from Firestore in real-time.
    // It automatically handles offline caching and synchronization.
    return collectionData(this.productsCollection, { idField: 'id' }) as Observable<Product[]>;
  }

  /**
   * Adds a new product to Firestore.
   * Firestore handles offline creation and syncs when online.
   */
  addProduct(productData: Omit<Product, 'id'>): Observable<string> {
    const promise = addDoc(this.productsCollection, productData).then(docRef => docRef.id);
    return from(promise);
  }

  /**
   * Updates an existing product in Firestore.
   */
  updateProduct(updatedProduct: Product): Observable<void> {
    const productDoc = doc(this.firestore, `products/${updatedProduct.id}`);
    // Destructure to avoid sending the id field inside the document data
    const { id, ...data } = updatedProduct;
    return from(updateDoc(productDoc, data));
  }

  /**
   * Deletes a product from Firestore.
   */
  deleteProduct(id: string): Observable<void> {
    const productDoc = doc(this.firestore, `products/${id}`);
    return from(deleteDoc(productDoc));
  }

  /**
   * Atomically updates the stock for a given product.
   * Uses Firestore's `increment` for safe concurrent updates.
   */
  updateStock(productId: string, quantityChange: number): Observable<void> {
    const productDoc = doc(this.firestore, `products/${productId}`);
    return from(updateDoc(productDoc, {
      stock: increment(quantityChange)
    })
    );
  }
}