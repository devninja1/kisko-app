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
    { name: 'Laptop Pro', category: 'Electronics', description: 'A powerful laptop for professionals', unit_price: 1200, cost_price: 950, stock: 10, is_active: true },
    { name: 'Wireless Mouse', category: 'Accessories', description: 'Ergonomic wireless mouse', unit_price: 25, cost_price: 15, stock: 50, is_active: true },
    { name: 'Mechanical Keyboard', category: 'Accessories', description: 'RGB Mechanical Keyboard', unit_price: 95, cost_price: 60, stock: 25, is_active: false },
    { name: '4K Monitor', category: 'Electronics', description: '27-inch 4K UHD Monitor', unit_price: 450, cost_price: 350, stock: 15, is_active: true },
    { name: 'Webcam HD', category: 'Accessories', description: '1080p HD Webcam for streaming', unit_price: 60, cost_price: 40, stock: 30, is_active: true },
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