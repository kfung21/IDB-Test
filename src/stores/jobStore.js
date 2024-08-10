import { defineStore } from 'pinia';
import { openDB, deleteDB } from 'idb';

const STORE_NAME = 'jobs';

const openDatabase = async (dbName) => {
  return openDB(dbName, 1, {
    upgrade(db, oldVersion, newVersion, transaction) {
      db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      const metaStore = db.createObjectStore('metadata', { keyPath: 'key' });
      metaStore.put({ key: 'creationDate', value: new Date().toISOString() });
    },
  });
};

const cleanJobForStorage = (job) => {
  const cleanJob = {};
  const allowedFields = ['id', 'jobTitle', 'salary', 'closingDate', 'agency', 'city', 'county'];
  
  for (const field of allowedFields) {
    if (job[field] !== undefined && job[field] !== null && job[field] !== '') {
      cleanJob[field] = job[field];
    }
  }
  
  if (cleanJob.salary) {
    cleanJob.salary = Number(cleanJob.salary);
  }
  
  return cleanJob;
};

export const useJobStore = defineStore('job', {
  state: () => ({
    jobs: [],
    searchResults: [],
    dbInfo: null,
    currentDbName: 'JobsDB',
    availableDatabases: [],

  }),
  actions: {
    async initializeStore() {
      await this.loadAvailableDatabases();
      if (this.availableDatabases.length === 0) {
        await this.createNewDatabase('JobsDB');
      } else {
        this.currentDbName = this.availableDatabases[0];
        await this.switchDatabase(this.currentDbName);
      }
    },
    async loadAvailableDatabases() {
      try {
        const dbs = await indexedDB.databases();
        this.availableDatabases = dbs.map(db => db.name);
        console.log('Available databases:', this.availableDatabases);
      } catch (error) {
        console.error('Error loading available databases:', error);
        // Fallback: If indexedDB.databases() is not supported, we'll use our current database
        this.availableDatabases = [this.currentDbName];
      }
    },
    async createNewDatabase(newDbName) {
      try {
        if (newDbName && newDbName.trim() !== '' && !this.availableDatabases.includes(newDbName)) {
          const db = await openDatabase(newDbName);
          db.close();
          await this.loadAvailableDatabases();
          this.currentDbName = newDbName;
          console.log(`New database '${newDbName}' created successfully.`);
          await this.getDatabaseInfo();
          await this.fetchJobs(); // Refresh jobs for the new database
        } else {
          console.error('Invalid database name or database already exists');
        }
      } catch (error) {
        console.error('Error creating new database:', error);
      }
    },
    
    

    async fetchJobs() {
      try {
        const db = await openDatabase(this.currentDbName);
        this.jobs = await db.getAll(STORE_NAME);
        console.log('Fetched jobs:', this.jobs);
      } catch (error) {
        console.error('Error fetching jobs:', error);
        this.jobs = [];
      }
    },

    async addJob(job) {
      try {
        const db = await openDatabase(this.currentDbName);
        const cleanedJob = cleanJobForStorage(job);
        const id = await db.add(STORE_NAME, cleanedJob);
        this.jobs.push({ id, ...cleanedJob });
        console.log('Added job:', { id, ...cleanedJob });
      } catch (error) {
        console.error('Error adding job:', error);
      }
    },

    async updateJob(job) {
      try {
        const db = await openDatabase(this.currentDbName);
        const cleanedJob = cleanJobForStorage(job);
        await db.put(STORE_NAME, cleanedJob);
        const index = this.jobs.findIndex((j) => j.id === cleanedJob.id);
        if (index !== -1) {
          this.jobs[index] = cleanedJob;
        }
        console.log('Updated job:', cleanedJob);
      } catch (error) {
        console.error('Error updating job:', error);
      }
    },

    async deleteJob(id) {
      try {
        const db = await openDatabase(this.currentDbName);
        await db.delete(STORE_NAME, id);
        this.jobs = this.jobs.filter((job) => job.id !== id);
        console.log('Deleted job with id:', id);
      } catch (error) {
        console.error('Error deleting job:', error);
      }
    },

    async searchJobs(query) {
      try {
        const db = await openDatabase(this.currentDbName);
        const allJobs = await db.getAll(STORE_NAME);
        this.searchResults = allJobs.filter(job => 
          Object.values(job).some(value => 
            String(value).toLowerCase().includes(query.toLowerCase())
          )
        );
        console.log('Search results:', this.searchResults);
      } catch (error) {
        console.error('Error searching jobs:', error);
        this.searchResults = [];
      }
      return this.searchResults;
    },

    async getDatabaseInfo() {
      try {
        const db = await openDatabase(this.currentDbName);
        const tx = db.transaction('metadata', 'readonly');
        const metaStore = tx.objectStore('metadata');
        const creationDate = await metaStore.get('creationDate');
        
        this.dbInfo = {
          name: db.name,
          version: db.version,
          creationDate: creationDate ? creationDate.value : 'Unknown'
        };
        
        console.log('Database info:', this.dbInfo);
      } catch (error) {
        console.error('Error getting database info:', error);
        this.dbInfo = null;
      }
      return this.dbInfo;
    },

     async deleteDatabase() {
      try {
        await deleteDB(this.currentDbName);
        await this.loadAvailableDatabases();
        this.jobs = [];
        this.searchResults = [];
        this.dbInfo = null;
        console.log('Database deleted');
        
        if (this.availableDatabases.length > 0) {
          this.currentDbName = this.availableDatabases[0];
          await this.switchDatabase(this.currentDbName);
        } else {
          await this.createNewDatabase('JobsDB');
        }
      } catch (error) {
        console.error('Error deleting database:', error);
      }
    },

    async switchDatabase(dbName) {
      if (this.availableDatabases.includes(dbName)) {
        this.currentDbName = dbName;
        await this.getDatabaseInfo();
        await this.fetchJobs();
      } else {
        console.error('Database does not exist');
        // If the database doesn't exist, create it
        await this.createNewDatabase(dbName);
      }
    },

    async searchJobs(query) {
      try {
        if (!this.currentDbName || !this.availableDatabases.includes(this.currentDbName)) {
          console.error('No valid database selected');
          this.searchResults = [];
          return this.searchResults;
        }
        
        const db = await openDatabase(this.currentDbName);
        const allJobs = await db.getAll(STORE_NAME);
        this.searchResults = allJobs.filter(job => 
          Object.values(job).some(value => 
            String(value).toLowerCase().includes(query.toLowerCase())
          )
        );
        console.log('Search results:', this.searchResults);
      } catch (error) {
        console.error('Error searching jobs:', error);
        this.searchResults = [];
      }
      return this.searchResults;
    },
  },
});